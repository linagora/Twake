import CompanyUser from "src/services/user/entities/company_user";
import { logger } from "../../../../core/platform/framework";
import { ExecutionContext, Pagination } from "../../../../core/platform/framework/api/crud-service";
import { TwakePlatform } from "../../../../core/platform/platform";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { AccessInformation, DriveFile } from "../../../../services/documents/entities/drive-file";
import { generateAccessToken, getDefaultDriveItem } from "../../../../services/documents/utils";
import globalResolver from "../../../../services/global-resolver";
import Company from "../../../../services/user/entities/company";
import Workspace from "../../../../services/workspaces/entities/workspace";
import WorkspaceUser from "../../../../services/workspaces/entities/workspace_user";
import { PhpDriveFileService } from "./php-drive-service";

let didPassFromWorkspace = false;
let didPassFromItem = false;

interface CompanyExecutionContext extends ExecutionContext {
  company: {
    id: string;
  };
}

interface WorkspaceExecutionContext extends CompanyExecutionContext {
  workspace_id: string;
}

class DriveLinksMigrator {
  private phpDriveService: PhpDriveFileService;
  private nodeRepository: Repository<DriveFile>;
  private options: {
    ignoreThumbnails?: boolean;
    fromItem?: string;
    fromWorkspace?: string;
    fromCompany?: string;
    onlyCompany?: string;
  };

  constructor(
    readonly _platform: TwakePlatform,
    options?: {
      ignoreThumbnails?: boolean;
      fromItem?: string;
      fromWorkspace?: string;
      fromCompany?: string;
      onlyCompany?: string;
    },
  ) {
    this.options = options;
    this.phpDriveService = new PhpDriveFileService();
  }

  /**
   * Run
   */
  public run = async (): Promise<void> => {
    await globalResolver.doInit(this._platform);
    await this.phpDriveService.init();

    this.nodeRepository = await globalResolver.database.getRepository<DriveFile>(
      "drive_files",
      DriveFile,
    );

    let page: Pagination = { limitStr: "100" };
    const context: ExecutionContext = {
      user: {
        id: null,
        server_request: true,
      },
    };

    let didPassFromCompany = false;
    do {
      const companyListResult = await globalResolver.services.companies.getCompanies(page);
      page = companyListResult.nextPage as Pagination;

      const companies = companyListResult.getEntities();
      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        if (this.options.onlyCompany && this.options.onlyCompany !== company.id) continue;
        if (this.options.fromCompany && this.options.fromCompany === company.id) {
          didPassFromCompany = true;
        }
        if (this.options.fromCompany && !didPassFromCompany) continue;

        console.log(`Migrating company ${company.id} (next will be ${companies[i + 1]?.id})`);
        await this.migrateCompany(company, {
          ...context,
          company: { id: company.id },
        });
      }
    } while (page.page_token);

    console.log("Migration done");
  };

  /**
   * Migrate a company drive files.
   *
   * @param {Company} company - the company to migrate
   */
  private migrateCompany = async (
    company: Company,
    context: CompanyExecutionContext,
  ): Promise<void> => {
    const companyAdminOrOwnerId = await this.getCompanyOwnerOrAdminId(company.id, context);
    if (!companyAdminOrOwnerId) {
      return;
    }
    const workspaceList = await globalResolver.services.workspaces.getAllForCompany(company.id);
    if (!workspaceList || workspaceList.length === 0) {
      return;
    }
    for (let i = 0; i < workspaceList.length; i++) {
      const workspace = workspaceList[i];
      if (this.options.fromWorkspace && this.options.fromWorkspace === workspace.id) {
        didPassFromWorkspace = true;
      }
      if (this.options.fromWorkspace && !didPassFromWorkspace) continue;

      const wsContext = {
        ...context,
        workspace_id: workspace.id,
        user: { id: companyAdminOrOwnerId, server_request: true },
      };
      const access = await this.getWorkspaceAccess(workspace, company, wsContext);

      console.log(
        `Migrating workspace ${workspace.id} root folder (next will be ${
          workspaceList[i + 1]?.id
        })`,
      );
      await this.migrateWorkspace(workspace, access, wsContext);
    }
  };

  /**
   * Migrates a workspace drive files.
   *
   * @param {Workspace} workspace - the workspace to migrate
   */
  private migrateWorkspace = async (
    workspace: Workspace,
    access: AccessInformation,
    context: WorkspaceExecutionContext,
  ): Promise<void> => {
    let page: Pagination = { limitStr: "100" };

    const workspaceFolder = await this.createWorkspaceFolder(workspace, access, context);
    // Migrate the root folder.
    do {
      const phpDriveFiles = await this.phpDriveService.listDirectory(
        page,
        "",
        workspace.id,
        context,
      );
      page = phpDriveFiles.nextPage as Pagination;

      const driveFiles = phpDriveFiles.getEntities();
      for (let i = 0; i < driveFiles.length; i++) {
        const phpDriveFile = driveFiles[i];
        if (this.options.fromItem && this.options.fromItem === phpDriveFile.id) {
          didPassFromItem = true;
        }
        if (this.options.fromItem && !didPassFromItem) continue;

        logger.info(
          `Migrating php drive item ${phpDriveFile.id} - parent: ${
            workspaceFolder.id ?? "root"
          } (next php file will be ${driveFiles[i + 1]?.id})`,
        );
        await this.migrateDriveFile(phpDriveFile, workspaceFolder.id, access, context);
      }
    } while (page.page_token);

    logger.info(`Migrating workspace ${workspace.id} trash`);
    // Migrate the trash.
    page = { limitStr: "100" };

    do {
      const phpDriveFiles = await this.phpDriveService.listDirectory(page, "trash", workspace.id);
      page = phpDriveFiles.nextPage as Pagination;

      for (const _ of phpDriveFiles.getEntities()) {
        await this.migrateDriveFile(/*phpDriveFile, "trash", access, context*/);
      }
    } while (page.page_token);
  };

  /**
   * Migrates a php drive item to a Node drive file
   *
   * @param {PhpDriveItem} item - the php drive file to migrate.
   */
  private migrateDriveFile = async (): Promise<void> => {
    throw new Error("Not implemented yet");
  };

  /**
   * Fetches the first found company owner or admin identifier.
   *
   * @param {string} companyId - the companyId
   * @param {ExecutionContext} context - the execution context
   * @returns {Promise<string>}
   */
  private getCompanyOwnerOrAdminId = async (
    companyId: string,
    context: ExecutionContext,
  ): Promise<string> => {
    let pagination: Pagination = { limitStr: "100" };
    let companyOwnerOrAdminId = null;

    do {
      const companyUsers = await globalResolver.services.companies.companyUserRepository.find(
        { group_id: companyId },
        { pagination },
        context,
      );
      if (!companyUsers.getEntities().length && !pagination?.page_token) {
        return null;
      }

      pagination = companyUsers.nextPage as Pagination;

      const companyAdminOrOwner = companyUsers
        .getEntities()
        .find(({ role }) => ["admin", "owner"].includes(role));

      if (companyAdminOrOwner) {
        companyOwnerOrAdminId = companyAdminOrOwner.id;
      }
    } while (pagination?.page_token && !companyOwnerOrAdminId);

    return companyOwnerOrAdminId;
  };

  /**
   * Compute the Access Information for the workspace folder to be created.
   *
   * @param {Workspace} workspace - the target workspace
   * @param {Company} company - the target company
   * @param {WorkspaceExecutionContext} context - the execution context
   * @returns {Promise<AccessInformation>}
   */
  private getWorkspaceAccess = async (
    workspace: Workspace,
    company: Company,
    context: WorkspaceExecutionContext,
  ): Promise<AccessInformation> => {
    const companyUsersCount = await globalResolver.services.companies.getUsersCount(company.id);
    const workspaceUsersCount = await globalResolver.services.workspaces.getUsersCount(
      workspace.id,
    );

    if (companyUsersCount === workspaceUsersCount) {
      return {
        entities: [
          {
            id: "parent",
            type: "folder",
            level: "manage",
          },
          {
            id: company.id,
            type: "company",
            level: "none",
          },
          {
            id: context.user?.id,
            type: "user",
            level: "manage",
          },
        ],
        public: {
          level: "none",
          token: generateAccessToken(),
        },
      };
    }

    let workspaceUsers: WorkspaceUser[] = [];
    let wsUsersPagination: Pagination = { limitStr: "100" };

    do {
      const wsUsersQuery = await globalResolver.services.workspaces.getUsers(
        { workspaceId: workspace.id },
        wsUsersPagination,
        context,
      );
      wsUsersPagination = wsUsersQuery.nextPage as Pagination;

      workspaceUsers = [...workspaceUsers, ...wsUsersQuery.getEntities()];
    } while (wsUsersPagination.page_token);

    if (companyUsersCount < 30 || workspaceUsersCount < 30) {
      return {
        entities: [
          {
            id: "parent",
            type: "folder",
            level: "none",
          },
          {
            id: company.id,
            type: "company",
            level: "none",
          },
          {
            id: context.user?.id,
            type: "user",
            level: "manage",
          },
          ...workspaceUsers.reduce((acc, curr) => {
            acc = [
              ...acc,
              {
                id: curr.userId,
                type: "user",
                level: "manage",
              },
            ];

            return acc;
          }, []),
        ],
        public: {
          level: "none",
          token: generateAccessToken(),
        },
      };
    }

    let companyUsers: CompanyUser[] = [];
    let companyUsersPaginations: Pagination = { limitStr: "100" };
    do {
      const companyUsersQuery = await globalResolver.services.companies.getUsers(
        { group_id: company.id },
        companyUsersPaginations,
        {},
        context,
      );
      companyUsersPaginations = companyUsersQuery.nextPage as Pagination;
      companyUsers = [...companyUsers, ...companyUsersQuery.getEntities()];
    } while (companyUsersPaginations.page_token);
    return {
      entities: [
        {
          id: "parent",
          type: "folder",
          level: "none",
        },
        {
          id: company.id,
          type: "company",
          level: "manage",
        },
        {
          id: context.user?.id,
          type: "user",
          level: "manage",
        },
        ...companyUsers.reduce((acc, curr) => {
          if (workspaceUsers.find(({ userId }) => curr.user_id === userId)) {
            return acc;
          }

          acc = [
            ...acc,
            {
              id: curr.user_id,
              type: "user",
              level: "none",
            },
          ];

          return acc;
        }, []),
      ],
      public: {
        level: "none",
        token: generateAccessToken(),
      },
    };
  };

  /**
   * Creates a folder for the workspace to migrate.
   *
   * @param {Workspace} workspace - the workspace to migrate.
   * @param {AccessInformation} access - the access information.
   * @param {WorkspaceExecutionContext} context - the execution context
   * @returns {Promise<DriveFile>}
   */
  private createWorkspaceFolder = async (
    workspace: Workspace,
    access: AccessInformation,
    context: WorkspaceExecutionContext,
  ): Promise<DriveFile> => {
    const workspaceFolder = getDefaultDriveItem(
      {
        name: workspace.name || workspace.id,
        extension: "",
        content_keywords: "",
        creator: context.user.id,
        is_directory: true,
        is_in_trash: false,
        description: "",
        tags: [],
        parent_id: "root",
        company_id: context.company.id,
        access_info: access,
      },
      context,
    );

    await this.nodeRepository.save(workspaceFolder);
    await this.phpDriveService.markAsMigrated(workspace.id, workspaceFolder.id, context.company.id);

    return workspaceFolder;
  };
}

export default DriveLinksMigrator;
