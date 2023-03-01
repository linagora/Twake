import { ExecutionContext, Pagination } from "src/core/platform/framework/api/crud-service";
import { TwakePlatform } from "src/core/platform/platform";
import Repository from "src/core/platform/services/database/services/orm/repository/repository";
import { DriveFile } from "src/services/documents/entities/drive-file";
import { FileVersion } from "src/services/documents/entities/file-version";
import { getDefaultDriveItem, getDefaultDriveItemVersion } from "src/services/documents/utils";
import globalResolver from "src/services/global-resolver";
import Company from "src/services/user/entities/company";
import Workspace from "src/services/workspaces/entities/workspace";
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
  private nodeVersionRepository: Repository<FileVersion>;

  constructor(readonly _platform: TwakePlatform) {
    this.phpDriveService = new PhpDriveFileService();
  }

  /**
   * Run
   */
  public run = async (): Promise<void> => {
    await globalResolver.doInit(this._platform);

    this.nodeRepository = await globalResolver.database.getRepository<DriveFile>(
      "drive_files",
      DriveFile,
    );
    this.nodeVersionRepository = await globalResolver.database.getRepository<FileVersion>(
      "drive_file_versions",
      FileVersion,
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

    do {
      const phpDriveFiles = await this.phpDriveService.listDirectory(page, "root", workspace.id);
      page = phpDriveFiles.nextPage as Pagination;

      for (const phpDriveFile of phpDriveFiles.getEntities()) {
        await this.migrateDriveFile(phpDriveFile, "root", context);
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
          await this.migrateDriveFile(child, newDriveItem.id, context);
        }
      } while (page.page_token);
    } else {
      let versionPage: Pagination = { limitStr: "100" };

      do {
        const itemVersions = await this.phpDriveService.listItemVersions(
          versionPage,
          item.id,
          context,
        );
        versionPage = itemVersions.nextPage as Pagination;

        for (const version of itemVersions.getEntities()) {
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

          // TODO: tranfer files ( S3 / local )

          await globalResolver.services.documents.documents.createVersion(
            newDriveItem.id,
            newVersion,
            context,
          );
        }
      } while (versionPage.page_token);
    }
  };
}

export default DriveMigrator;
