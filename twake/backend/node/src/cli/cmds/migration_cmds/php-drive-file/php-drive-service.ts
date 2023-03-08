import {
  ExecutionContext,
  ListResult,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import globalResolver from "../../../../services/global-resolver";
import { PhpDriveFile } from "./php-drive-file-entity";
import { Initializable, logger, TwakeServiceProvider } from "../../../../core/platform/framework";
import { PhpDriveFileVersion } from "./php-drive-file-version-entity";
import axios from "axios";
import { Stream } from "stream";
import { Multipart } from "fastify-multipart";
import { CompanyExecutionContext } from "../../../../services/files/web/types";
import { File } from "../../../../services/files/entities/file";
import { UploadOptions } from "../../../../services/files/types";

export interface MigrateOptions extends UploadOptions {
  userId: string;
}

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

  /**
   * Downloads a file from the old drive and uploads it to the new Drive.
   *
   * @param {string} fileId - the old file id
   * @param {string} workspaceId - the workspace id
   * @param {MigrateOptions} options - the file upload / migration options.
   * @param {CompanyExecutionContext} context - the company execution context.
   * @param {string} public_access_key - the file public access key.
   * @returns {Promise<File>} - the uploaded file information.
   */
  migrate = async (
    fileId: string,
    workspaceId: string,
    options: MigrateOptions,
    context: CompanyExecutionContext,
    public_access_key?: string,
  ): Promise<File> => {
    try {
      const url = `https://web.twake.app/ajax/drive/download?workspace_id=${workspaceId}&element_id=${fileId}&download=1${
        public_access_key ? `&public_access_key=${public_access_key}` : ""
      }`;

      const response = await axios.get<Stream>(url, {
        responseType: "stream",
      });

      const file = {
        file: response.data,
      };

      return await globalResolver.services.files.save(null, file as Multipart, options, {
        ...context,
        user: {
          id: options.userId,
        },
      });
    } catch (error) {
      logger.error(`Failed to migrate file ${fileId} on workspace ${workspaceId}`, error);
      throw Error(error);
    }
  };

  /**
   * Saves a drive item.
   *
   * @param {PhpDriveFile} item - the php drive item.
   * @returns {Promise<void>}
   */
  save = async (item: PhpDriveFile): Promise<void> => await this.repository.save(item);
}
