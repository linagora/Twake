import { logger } from "../../../../core/platform/framework";
import { ExecutionContext, Pagination } from "../../../../core/platform/framework/api/crud-service";
import { TwakePlatform } from "../../../../core/platform/platform";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { DriveFile } from "../../../../services/documents/entities/drive-file";
import {
  getDefaultDriveItem,
  getDefaultDriveItemVersion,
} from "../../../../services/documents/utils";
import globalResolver from "../../../../services/global-resolver";
import Company from "../../../../services/user/entities/company";
import Workspace from "../../../../services/workspaces/entities/workspace";
import { PhpDriveFile } from "./php-drive-file-entity";
import { PhpDriveFileService } from "./php-drive-service";

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

    console.debug("Starting migration");

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
    console.debug(`Migrating company ${company.id}`);

    const workspaceList = await globalResolver.services.workspaces.getAllForCompany(company.id);

    for (const workspace of workspaceList) {
      await this.migrateWorkspace(workspace, { ...context, workspace_id: workspace.id });
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
    let page: Pagination = { limitStr: "100" };

    console.debug(`Migrating workspace ${workspace.id} root folder`);
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
        await this.migrateDriveFile(phpDriveFile, "", context);
      }
    } while (page.page_token);

    console.debug(`Migrating workspace ${workspace.id} trash`);
    // Migrate the trash.
    page = { limitStr: "100" };

    do {
      const phpDriveFiles = await this.phpDriveService.listDirectory(page, "trash", workspace.id);
      page = phpDriveFiles.nextPage as Pagination;

      for (const phpDriveFile of phpDriveFiles.getEntities()) {
        await this.migrateDriveFile(phpDriveFile, "trash", context);
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
    context: WorkspaceExecutionContext,
  ): Promise<void> => {
    logger.info(`Migrating php drive item ${item.id} - parent: ${parentId}`);
    console.debug(`Migrating php drive item ${item.id} - parent: ${parentId}`);

    try {
      const newDriveItem = getDefaultDriveItem(
        {
          name: item.name,
          extension: item.extension,
          added: item.added.toString(),
          content_keywords: item.content_keywords,
          creator: item.creator,
          is_directory: item.isdirectory,
          is_in_trash: item.isintrash,
          description: item.description,
          tags: item.tags,
          parent_id: parentId,
          company_id: context.company.id,
        },
        context,
      );

      await this.nodeRepository.save(newDriveItem);

      if (item.isdirectory) {
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
              await this.migrateDriveFile(child, newDriveItem.id, context);
            } catch (error) {
              logger.error(`Failed to migrate drive item ${child.id}`);
              console.error(`Failed to migrate drive item ${child.id}`);
            }
          }
        } while (page.page_token);
      } else {
        let versionPage: Pagination = { limitStr: "100" };
        if ((item.hidden_data as any)?.migrated) {
          logger.info(`item is already migrated - ${item.id} - skipping`);
          logger.info(`item is already migrated - ${item.id} - skipping`);
        }

        do {
          const itemVersions = await this.phpDriveService.listItemVersions(
            versionPage,
            item.id,
            context,
          );
          versionPage = itemVersions.nextPage as Pagination;

          for (const version of itemVersions.getEntities()) {
            console.debug(`Migrating version ${version.id}`);
            try {
              const newVersion = getDefaultDriveItemVersion(
                {
                  creator_id: version.creator_id,
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

              const file = await this.phpDriveService.migrate(
                version.file_id,
                item.workspace_id,
                {
                  filename: version.filename,
                  userId: version.creator_id,
                  totalSize: version.file_size,
                  waitForThumbnail: true,
                  chunkNumber: 1,
                  totalChunks: 1,
                  type: undefined,
                },
                context,
              );

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
            } catch (error) {
              logger.error(`Failed to migrate version ${version.id} for drive item ${item.id}`);
              console.error(`Failed to migrate version ${version.id} for drive item ${item.id}`);
              throw Error(error);
            }
          }
        } while (versionPage.page_token);
      }

      if (!(item.hidden_data as any)?.migrated) {
        item.hidden_data = {
          ...((item.hidden_data as any) || {}),
          migrated: true,
        };

        await this.phpDriveService.save(item);
      }
    } catch (error) {
      logger.error(`Failed to migrate Drive item ${item.id}`, error);
      console.error(`Failed to migrate Drive item ${item.id}`, error);
    }
  };
}

export default DriveMigrator;
