import { logger } from "../../../../core/platform/framework";
import { ExecutionContext, Pagination } from "../../../../core/platform/framework/api/crud-service";
import { TwakePlatform } from "../../../../core/platform/platform";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { DriveFile } from "../../../../services/documents/entities/drive-file";

import globalResolver from "../../../../services/global-resolver";
import Company from "../../../../services/user/entities/company";
import Workspace from "../../../../services/workspaces/entities/workspace";
import { PhpDriveFile } from "./php-drive-file-entity";
import { PhpDriveFileService } from "./php-drive-service";
import { DriveItemDetails } from "src/services/documents/types";

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

class DrivePathsMigrator {
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

      console.log(
        `Migrating workspace ${workspace.id} root folder (next will be ${
          workspaceList[i + 1]?.id
        })`,
      );
      await this.migrateWorkspace(workspace, wsContext);
    }
  };

  /**
   * Migrates a workspace drive files.
   *
   * @param {Workspace} workspace - the workspace to migrate
   */
  private migrateWorkspace = async (
    workspace: Workspace,
    context: WorkspaceExecutionContext,
  ): Promise<void> => {
    const phpRoots = (
      await this.phpDriveService.listDirectory({ limitStr: "1000" }, "", workspace.id, context)
    )
      .getEntities()
      .filter(a => a.parent_id === "");
    phpRoots.sort((a, b) => new Date(b.added).getTime() - new Date(a.added).getTime());
    const activeRoot = phpRoots[0];

    let workspaceFolder: DriveItemDetails;

    //Find workspace folders, remove the empty ones
    const workspaceNewRoot = await globalResolver.services.documents.documents.get("root", {
      ...context,
      user: { ...context.user, server_request: true },
    });
    if (workspaceNewRoot) {
      for (let i = 0; i < workspaceNewRoot.children.length; i++) {
        if (workspaceNewRoot.children[i].name === workspace.name) {
          if (workspaceNewRoot.children[i].size === 0) {
            await globalResolver.services.documents.documents.update(
              workspaceNewRoot.children[i].id,
              {
                parent_id: "trash",
              },
              { ...context, user: { ...context.user, server_request: true } },
            );
          } else {
            workspaceFolder = await globalResolver.services.documents.documents.get(
              workspaceNewRoot.children[i].id,
              { ...context, user: { ...context.user, server_request: true } },
            );
          }
        }
      }
    }

    if (!workspaceFolder) {
      console.log("Can't find workspace folder, for workspace" + workspace.id, "ignoring...");
      return;
    }

    if (!workspaceFolder.children.find(c => c.name === "detached-files")) {
      await globalResolver.services.documents.documents.create(
        null,
        {
          name: "detached-files",
          parent_id: workspaceFolder.item.id,
          is_directory: true,
        },
        {},
        { ...context, user: { ...context.user, server_request: true } },
      );
      workspaceFolder = await globalResolver.services.documents.documents.get(
        workspaceFolder.item.id,
        {
          ...context,
          user: { ...context.user, server_request: true },
        },
      );
    }

    await this.migrateFolder("", workspace, activeRoot, workspaceFolder, context);
    await this.migrateFolder("detached", workspace, activeRoot, workspaceFolder, context);
    await this.migrateFolder("trash", workspace, activeRoot, workspaceFolder, context);
    await this.migrateFolder("removed_trashes", workspace, activeRoot, workspaceFolder, context);

    //Cleanup: remove empty folders in workspace root
    const workspaceFolderUpdated = await globalResolver.services.documents.documents.get(
      workspaceFolder.item.id,
      {
        ...context,
        user: { ...context.user, server_request: true },
      },
    );
    if (workspaceFolderUpdated) {
      for (let i = 0; i < workspaceFolderUpdated.children.length; i++) {
        if (workspaceFolderUpdated.children[i].size === 0) {
          await globalResolver.services.documents.documents.update(
            workspaceFolderUpdated.children[i].id,
            {
              parent_id: "trash",
            },
            { ...context, user: { ...context.user, server_request: true } },
          );
        }
      }
    }
  };

  private migrateFolder = async (
    parentId: string,
    workspace: Workspace,
    activeRoot: PhpDriveFile,
    workspaceFolder: DriveItemDetails,
    context: WorkspaceExecutionContext,
  ): Promise<void> => {
    let page: Pagination = { limitStr: "100" };

    do {
      const phpDriveFiles = await this.phpDriveService.listDirectory(
        page,
        parentId,
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

        await this.migrateDriveFile(phpDriveFile, activeRoot, workspaceFolder, context);

        if (phpDriveFile.isdirectory) {
          await this.migrateFolder(
            phpDriveFile.id,
            workspace,
            activeRoot,
            workspaceFolder,
            context,
          );
        }
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
    activeRoot: PhpDriveFile,
    workspaceFolder: DriveItemDetails,
    context: WorkspaceExecutionContext,
  ): Promise<void> => {
    const migrationRecord = await this.phpDriveService.getMigrationRecord(
      item.id,
      context.company.id,
    );

    if (!migrationRecord) {
      return;
    }

    try {
      //Get all available data

      const migratedItemWithPath = await globalResolver.services.documents.documents.get(
        migrationRecord.new_id,
        { ...context, user: { ...context.user, server_request: true } },
      );

      const oldFileItemPath = [];
      let i = 0;
      let currentParentId = item.id;
      while (i < 100) {
        if (["", "detached", "removed_trashes", "trash"].includes(currentParentId)) break;
        const parentItem = await this.phpDriveService.getItem(currentParentId);
        if (!parentItem) break;
        oldFileItemPath.unshift({
          old: parentItem,
          migrationRecord: await this.phpDriveService.getMigrationRecord(
            parentItem.id,
            context.company.id,
          ),
        });
        currentParentId = parentItem.parent_id;
        i++;
      }

      // 1. If first parent is detached move to detached-files in workspace root folder
      if (oldFileItemPath[0].old.parent_id === "detached") {
        await globalResolver.services.documents.documents.update(
          migratedItemWithPath.item.id,
          {
            parent_id: workspaceFolder.children.find(c => c.name === "detached-files").id,
          },
          { ...context, user: { ...context.user, server_request: true } },
        );
        return;
      }
      // 2. If parent is removed_trashes or trash, move to trash
      if (
        ["removed_trashes", "trash"].includes(item.parent_id) ||
        ["removed_trashes", "trash"].includes(oldFileItemPath[0].old.parent_id)
      ) {
        await globalResolver.services.documents.documents.update(
          migratedItemWithPath.item.id,
          {
            parent_id: "trash",
          },
          { ...context, user: { ...context.user, server_request: true } },
        );
        return;
      }

      // 3. If file was moved since the migration, do nothing
      if (
        migratedItemWithPath.item.parent_id !==
          oldFileItemPath[oldFileItemPath.length - 1].migrationRecord.new_id &&
        migratedItemWithPath.item.parent_id !== workspaceFolder.item.id
      ) {
        return;
      }

      if (activeRoot.id === item.parent_id) {
        await globalResolver.services.documents.documents.update(
          migratedItemWithPath.item.id,
          {
            parent_id: workspaceFolder.item.id,
          },
          { ...context, user: { ...context.user, server_request: true } },
        );
        return;
      }

      // 4. If parent is one of multiple workspace roots
      if (item.parent_id === "") {
        await globalResolver.services.documents.documents.update(
          migratedItemWithPath.item.id,
          {
            parent_id: "trash",
          },
          { ...context, user: { ...context.user, server_request: true } },
        );
        return;
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
}

export default DrivePathsMigrator;
