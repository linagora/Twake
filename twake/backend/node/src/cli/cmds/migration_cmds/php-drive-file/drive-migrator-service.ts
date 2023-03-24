import { logger } from "../../../../core/platform/framework";
import { ExecutionContext, Pagination } from "../../../../core/platform/framework/api/crud-service";
import { TwakePlatform } from "../../../../core/platform/platform";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { DriveFile, AccessInformation } from "../../../../services/documents/entities/drive-file";
import {
  generateAccessToken,
  getDefaultDriveItem,
  getDefaultDriveItemVersion,
} from "../../../../services/documents/utils";
import globalResolver from "../../../../services/global-resolver";
import Company from "../../../../services/user/entities/company";
import Workspace from "../../../../services/workspaces/entities/workspace";
import { PhpDriveFile } from "./php-drive-file-entity";
import { PhpDriveFileService } from "./php-drive-service";
import mimes from "../../../../utils/mime";
import WorkspaceUser from "../../../../services/workspaces/entities/workspace_user";
import CompanyUser from "src/services/user/entities/company_user";

interface CompanyExecutionContext extends ExecutionContext {
  company: {
    id: string;
  };
}

interface WorkspaceExecutionContext extends CompanyExecutionContext {
  workspace_id: string;
}

class DriveMigrator {
  private phpDriveService: PhpDriveFileService;
  private nodeRepository: Repository<DriveFile>;

  constructor(readonly _platform: TwakePlatform) {
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

    do {
      const companyListResult = await globalResolver.services.companies.getCompanies(page);
      page = companyListResult.nextPage as Pagination;

      for (const company of companyListResult.getEntities()) {
        await this.migrateCompany(company, {
          ...context,
          company: { id: company.id },
        });
      }
    } while (page.page_token);
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
    logger.info(`Migrating company ${company.id}`);

    const companyAdminOrOwnerId = await this.getCompanyOwnerOrAdminId(company.id, context);
    if (!companyAdminOrOwnerId) {
      return;
    }
    const workspaceList = await globalResolver.services.workspaces.getAllForCompany(company.id);
    if (!workspaceList || workspaceList.length === 0) {
      return;
    }

    for (const workspace of workspaceList) {
      const wsContext = {
        ...context,
        workspace_id: workspace.id,
        user: { id: companyAdminOrOwnerId, server_request: true },
      };
      const access = await this.getWorkspaceAccess(workspace, company, wsContext);

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

    console.debug(`Migrating workspace ${workspace.id} of company ${context.company.id}`);
    logger.info(`Migrating workspace ${workspace.id} root folder`);

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

      for (const phpDriveFile of phpDriveFiles.getEntities()) {
        await this.migrateDriveFile(phpDriveFile, workspaceFolder.id, access, context);
      }
    } while (page.page_token);

    logger.info(`Migrating workspace ${workspace.id} trash`);
    // Migrate the trash.
    page = { limitStr: "100" };

    do {
      const phpDriveFiles = await this.phpDriveService.listDirectory(page, "trash", workspace.id);
      page = phpDriveFiles.nextPage as Pagination;

      for (const phpDriveFile of phpDriveFiles.getEntities()) {
        await this.migrateDriveFile(phpDriveFile, "trash", access, context);
      }
    } while (page.page_token);
  };

  /**
   * Migrates a php drive item to a Node drive file
   *
   * @param {PhpDriveItem} item - the php drive file to migrate.
   */
  private migrateDriveFile = async (
    item: PhpDriveFile,
    parentId: string,
    access: AccessInformation,
    context: WorkspaceExecutionContext,
  ): Promise<void> => {
    logger.info(`Migrating php drive item ${item.id} - parent: ${parentId ?? "root"}`);

    try {
      const migrationRecord = await this.phpDriveService.getMigrationRecord(
        item.id,
        context.company.id,
      );

      const newDriveItem = getDefaultDriveItem(
        {
          name: item.name || item.id,
          extension: item.extension,
          added: item.added.toString(),
          content_keywords:
            item.content_keywords && item.content_keywords.length
              ? item.content_keywords.join(",")
              : "",
          creator: item.creator || context.user.id,
          is_directory: item.isdirectory,
          is_in_trash: item.isintrash,
          description: item.description,
          tags: item.tags || [],
          parent_id: parentId,
          company_id: context.company.id,
          access_info: access,
        },
        context,
      );

      if (migrationRecord && migrationRecord.company_id === context.company.id) {
        console.debug(`${item.id} is already migrated`);
      } else {
        await this.nodeRepository.save(newDriveItem);
      }

      if (item.isdirectory) {
        const newParentId =
          migrationRecord && migrationRecord.company_id === context.company.id
            ? migrationRecord.new_id
            : newDriveItem.id;

        let page: Pagination = { limitStr: "100" };

        do {
          const directoryChildren = await this.phpDriveService.listDirectory(
            page,
            item.id,
            context.workspace_id,
          );
          page = directoryChildren.nextPage as Pagination;

          for (const child of directoryChildren.getEntities()) {
            try {
              await this.migrateDriveFile(child, newParentId, access, context);
            } catch (error) {
              logger.error(`Failed to migrate drive item ${child.id}`);
              console.error(`Failed to migrate drive item ${child.id}`);
            }
          }
        } while (page.page_token);
      } else {
        let versionPage: Pagination = { limitStr: "100" };
        if (
          migrationRecord &&
          migrationRecord.item_id === item.id &&
          migrationRecord.company_id === context.company.id
        ) {
          logger.info(`item is already migrated - ${item.id} - skipping`);
          console.log(`item is already migrated - ${item.id} - skipping`);
          return;
        }

        const mime = mimes[item.extension];

        let createdVersions = 0;

        do {
          const itemVersions = await this.phpDriveService.listItemVersions(
            versionPage,
            item.id,
            context,
          );
          versionPage = itemVersions.nextPage as Pagination;

          for (const version of itemVersions.getEntities()) {
            try {
              const newVersion = getDefaultDriveItemVersion(
                {
                  creator_id: version.creator_id || context.user.id,
                  data: version.data,
                  date_added: +version.date_added,
                  drive_item_id: newDriveItem.id,
                  file_size: version.file_size,
                  filename: version.filename,
                  key: version.key,
                  provider: version.provider,
                  realname: version.realname,
                  mode: version.mode,
                },
                context,
              );

              logger.info(
                `Migrating version ${version.id} of item ${item.id}... (downloading then uploading...)`,
              );
              const file = await this.phpDriveService.migrate(
                version.file_id,
                item.workspace_id,
                version.id,
                {
                  filename: version.filename,
                  userId: version.creator_id || context.user.id,
                  totalSize: version.file_size,
                  waitForThumbnail: true,
                  chunkNumber: 1,
                  totalChunks: 1,
                  type: mime,
                },
                context,
              );

              if (!file) {
                throw Error("cannot download file version");
              }

              newVersion.file_metadata = {
                external_id: file.id,
                mime: file.metadata.mime,
                name: file.metadata.name || version.filename,
                size: file.upload_data.size || version.file_size,
              };

              await globalResolver.services.documents.documents.createVersion(
                newDriveItem.id,
                newVersion,
                context,
              );

              createdVersions++;
            } catch (error) {
              logger.error(`Failed to migrate version ${version.id} for drive item ${item.id}`);
              console.error(`Failed to migrate version ${version.id} for drive item ${item.id}`);
            }
          }
        } while (versionPage.page_token);

        if (createdVersions === 0) {
          await this.nodeRepository.remove(newDriveItem);
          return;
        }
      }

      if (!migrationRecord) {
        await this.phpDriveService.markAsMigrated(item.id, newDriveItem.id, context.company.id);
      }
    } catch (error) {
      logger.error(
        `Failed to migrate Drive item ${item.id} / workspace ${item.workspace_id} / company_id: ${context.company.id}`,
        error,
      );
      console.error(`Failed to migrate Drive item ${item.id}`, error);
    }
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

export default DriveMigrator;
