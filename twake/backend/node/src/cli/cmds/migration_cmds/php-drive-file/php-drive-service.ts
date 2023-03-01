import {
  ExecutionContext,
  ListResult,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import globalResolver from "../../../../services/global-resolver";
import { PhpDriveFile } from "./php-drive-file-entity";
import { Initializable, TwakeServiceProvider } from "../../../../core/platform/framework";
import { PhpDriveFileVersion } from "./php-drive-file-version-entity";

export interface PhpDriveServiceAPI extends TwakeServiceProvider, Initializable {}

export class PhpDriveFileService implements PhpDriveServiceAPI {
  version: "1";
  public repository: Repository<PhpDriveFile>;
  public versionRepository: Repository<PhpDriveFileVersion>;

  /**
   * Init the service.
   *
   * @returns {PhpDriveFileService}
   */
  async init(): Promise<this> {
    this.repository = await globalResolver.database.getRepository<PhpDriveFile>(
      "drive_file",
      PhpDriveFile,
    );

    this.versionRepository = await globalResolver.database.getRepository<PhpDriveFileVersion>(
      "drive_file_version",
      PhpDriveFileVersion,
    );

    return this;
  }

  /**
   * Lists the drive item directory children.
   *
   * @param {Pagination} pagination - the page.
   * @param {string} directory - the drive item / directory id to search within.
   * @param {string} workspaceId - the workspace id
   * @param {ExecutionContext} context - the execution context.
   * @returns {Promise<ListResult<PhpDriveFile>>} - the drive item children.
   */
  listDirectory = async (
    pagination: Pagination,
    directory: string | "root" | "trash",
    workspaceId: string,
    context?: ExecutionContext,
  ): Promise<ListResult<PhpDriveFile>> =>
    await this.repository.find(
      {
        workspace_id: workspaceId,
        parent_id: directory,
      },
      { pagination },
      context,
    );

  /**
   * Lists the versions of a drive item.
   *
   * @param {Pagination} pagination - the page.
   * @param {string} itemId - the drive item id.
   * @param {ExecutionContext} context - the execution context.
   * @returns {Promise<ListResult<PhpDriveFileVersion>>} - the list of the item versions.
   */
  listItemVersions = async (
    pagination: Pagination,
    itemId: string,
    context?: ExecutionContext,
  ): Promise<ListResult<PhpDriveFileVersion>> =>
    await this.versionRepository.find(
      {
        file_id: itemId,
      },
      { pagination },
      context,
    );
}
