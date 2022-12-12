import { getLogger, logger, TwakeLogger } from "../../../core/platform/framework";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import globalResolver from "../../../services/global-resolver";
import { CompanyExecutionContext, DriveItemDetails } from "../types";
import { DriveFile, TYPE } from "../entities/drive-file";
import { CrudException } from "../../../core/platform/framework/api/crud-service";
import { PublicFile } from "../../../services/files/entities/file";
import { getDefaultDriveItem, getDefaultDriveItemVersion } from "../utils";
import { FileVersion, TYPE as FileVersionType } from "../entities/file-version";

export class DocumentsService {
  version: "1";
  repository: Repository<DriveFile>;
  fileVersionRepository: Repository<FileVersion>;
  ROOT: "";
  logger: TwakeLogger = getLogger("Documents Service");

  async init(): Promise<this> {
    try {
      this.repository = await globalResolver.database.getRepository<DriveFile>(TYPE, DriveFile);
      this.fileVersionRepository = await globalResolver.database.getRepository<FileVersion>(
        FileVersionType,
        FileVersion,
      );
    } catch (error) {
      logger.error("Error while initializing Documents Service", error);
    }

    return this;
  }

  /**
   * Fetches a drive element
   *
   * @param {string} id - the id of the DriveFile to fetch or "trash" or an empty string for root folder.
   * @param {CompanyExecutionContext} context
   * @returns {Promise<DriveItemDetails>}
   */
  get = async (id: string, context: CompanyExecutionContext): Promise<DriveItemDetails> => {
    if (!context) {
      this.logger.error("invalid context");
      return null;
    }

    if (!id || !id.length || id === "") {
      const items = await this.repository.find(
        {
          parent_id: this.ROOT,
          is_instrash: false,
          company_id: context.company.id,
        },
        {},
        context,
      );

      return {
        children: items.getEntities(),
      };
    }

    if (id === "trash") {
      const items = await this.repository.find(
        {
          is_instrash: true,
          company_id: context.company.id,
        },
        {},
        context,
      );

      return {
        children: items.getEntities(),
      };
    }

    const entity = await this.repository.findOne(
      {
        id,
        company_id: context.company.id,
      },
      {},
      context,
    );

    if (!entity) {
      this.logger.error("Drive item not found");
      throw new CrudException("Item not found", 404);
    }

    const versions = await this.fileVersionRepository.find(
      {
        file_id: entity.id,
      },
      {},
      context,
    );

    if (!entity.is_directory) {
      return {
        item: entity,
        versions: versions.getEntities(),
        children: [],
      };
    }

    const children = await this.repository.find(
      {
        parent_id: id,
        company_id: context.company.id,
      },
      {},
      context,
    );

    return {
      item: entity,
      versions: versions.getEntities(),
      children: children.getEntities(),
    };
  };

  /**
   * Creates a DriveFile item.
   *
   * @param {PublicFile} file - the multipart file
   * @param {Partial<DriveFile>} content - the DriveFile item to create
   * @param {Partial<FileVersion>} version - the DriveFile version.
   * @param {CompanyExecutionContext} context - the company execution context.
   * @returns {Promise<DriveFile>} - the created DriveFile
   */
  create = async (
    file: PublicFile | null,
    content: Partial<DriveFile>,
    version: Partial<FileVersion>,
    context: CompanyExecutionContext,
  ): Promise<DriveFile> => {
    try {
      const driveItem = getDefaultDriveItem(content, context);
      const driveItemVersion = getDefaultDriveItemVersion(version, context);

      if (file) {
        driveItem.size = file.upload_data.size;
        driveItem.is_directory = false;
        driveItem.has_preview = true;
        driveItem.extension = file.metadata.name.split(".").pop();
        driveItemVersion.filename = driveItemVersion.filename || file.metadata.name;
        driveItemVersion.file_size = file.upload_data.size;
      }
      await this.fileVersionRepository.save(driveItemVersion);
      await this.repository.save({
        ...driveItem,
        last_version_cache: { ...driveItemVersion },
      });

      await this.updateItemSize(driveItem.parent_id, context);

      return driveItem;
    } catch (error) {
      this.logger.error("Failed to create drive item", error);
      throw new CrudException("Failed to create item", 500);
    }
  };

  /**
   * Updates a DriveFile item
   *
   * @param {string} id - the id of the DriveFile to update.
   * @param {Partial<DriveFile>} content - the updated content
   * @param {CompanyExecutionContext} context - the company execution context
   * @returns {Promise<DriveFile>} - the updated DriveFile
   */
  update = async (
    id: string,
    content: Partial<DriveFile>,
    context: CompanyExecutionContext,
  ): Promise<DriveFile> => {
    if (!context) {
      this.logger.error("invalid execution context");
      return null;
    }

    try {
      const item = await this.repository.findOne({
        id,
        company_id: context.company.id,
      });

      if (!item) {
        this.logger.error("Drive item not found");
        throw Error("Item not found");
      }

      const driveItem = getDefaultDriveItem(content, context);
      await this.repository.save(driveItem, context);
      await this.updateItemSize(driveItem.parent_id, context);

      return driveItem;
    } catch (error) {
      this.logger.error("Failed to update drive item", error);
      throw new CrudException("Failed to update item", 500);
    }
  };

  /**
   * deletes or moves to Trash a Drive Document
   *
   * @param {string} id - the item id
   * @param {CompanyExecutionContext} context - the execution context
   * @returns {Promise<void>}
   */
  delete = async (id: string | "trash" | "", context: CompanyExecutionContext): Promise<void> => {
    if (!id || id === "") {
      try {
        const rootFolderItems = await this.repository.find(
          {
            parent_id: this.ROOT,
            is_intrash: false,
          },
          {},
          context,
        );

        rootFolderItems.getEntities().forEach(async item => {
          if (item.is_directory) {
            await this.moveDirectoryContentsTotrash(item.id, context);
          }

          await this.repository.save(
            {
              ...item,
              is_instrash: true,
              parent_id: this.ROOT,
            },
            context,
          );
        });

        await this.updateItemSize("", context);
      } catch (error) {
        logger;
        throw new CrudException("Failed to delete root folder", 500);
      }

      return;
    }

    if (id === "trash") {
      try {
        const itemsInTrash = await this.repository.find(
          {
            is_instrash: true,
          },
          {},
          context,
        );

        itemsInTrash.getEntities().forEach(async item => {
          await this.repository.remove(item);
        });
      } catch (error) {
        this.logger.error("Failed to empty trash", error);
        throw new CrudException("Failed to empty trash", 500);
      }

      return;
    }

    const item = await this.repository.findOne(
      {
        id,
        company_id: context.company.id,
      },
      {},
      context,
    );

    if (!item) {
      this.logger.error("item to delete not found");
      throw new CrudException("Drive item not found", 404);
    }

    try {
      if (item.is_instrash) {
        const itemVersions = await this.fileVersionRepository.find(
          {
            file_id: item.id,
            provider: "internal",
          },
          {},
          context,
        );

        itemVersions.getEntities().forEach(async version => {
          await this.fileVersionRepository.remove(version);
        });
        return await this.repository.remove(item);
      }

      if (item.is_directory) {
        await this.moveDirectoryContentsTotrash(item.id, context);
      }

      await this.repository.save({
        ...item,
        is_instrash: true,
        parent_id: this.ROOT,
      });

      await this.updateItemSize(item.parent_id, context);
    } catch (error) {
      this.logger.error("Failed to delete drive item", error);
      throw new CrudException("Failed to delete item", 500);
    }
  };

  /**
   * Create a Drive item version
   *
   * @param {string} id - the Drive item id to create a version for.
   * @param {Partial<FileVersion>} version - the version item.
   * @param {CompanyExecutionContext} context - the company execution context
   * @returns {Promise<FileVersion>} - the created FileVersion
   */
  createVersion = async (
    id: string,
    version: Partial<FileVersion>,
    context: CompanyExecutionContext,
  ): Promise<FileVersion> => {
    if (!context) {
      this.logger.error("invalid execution context");
      return null;
    }

    try {
      const item = await this.repository.findOne(
        {
          id,
          company_id: context.company.id,
        },
        {},
        context,
      );

      if (!item) {
        throw Error("Drive item not found");
      }

      if (item.is_directory) {
        throw Error("cannot create version for a directory");
      }

      const driveItemVersion = getDefaultDriveItemVersion(version, context);
      await this.fileVersionRepository.save(driveItemVersion);
      await this.repository.save({
        ...item,
        last_version_cache: { ...driveItemVersion },
      });

      return driveItemVersion;
    } catch (error) {
      this.logger.error("Failed to create Drive item version", error);
      throw new CrudException("Failed to create Drive item version", 500);
    }
  };

  /**
   * Recursively move directory contents to trash
   *
   * @param {string} id - the directory id
   * @param {CompanyExecutionContext} context - the execution context
   * @returns {Promise<void>}
   */
  private moveDirectoryContentsTotrash = async (
    id: string,
    context?: CompanyExecutionContext,
  ): Promise<void> => {
    const children = await this.repository.find({
      company_id: context.company.id,
      parent_id: id,
    });

    children.getEntities().forEach(async child => {
      await this.repository.save({
        ...child,
        parent_id: this.ROOT,
        is_instrash: true,
      });

      if (child.is_directory) {
        return await this.moveDirectoryContentsTotrash(child.id, context);
      }
    });
  };

  /**
   * Recalculates and updates the Drive item size
   *
   * @param {string} id - the item id
   * @param {CompanyExecutionContext} context - the execution context
   * @returns {Promise<void>}
   */
  private updateItemSize = async (id: string, context: CompanyExecutionContext): Promise<void> => {
    if (!id || id === "" || id === "trash") return;

    const item = await this.repository.findOne({ id, company_id: context.company.id });

    if (!item) {
      logger.error("item doesn't exist");
      throw Error("Drive item doesn't exist");
    }

    item.size = await this.calculateItemSize(item, context);

    return await this.repository.save(item);
  };

  /**
   * Calculates the size of the Drive Item
   *
   * @param {DriveFile} item - The file or directory
   * @param {CompanyExecutionContext} context - the execution context
   * @returns {Promise<number>} - the size of the Drive Item
   */
  private calculateItemSize = async (
    item: DriveFile,
    context: CompanyExecutionContext,
  ): Promise<number> => {
    if (item.is_directory) {
      let initialSize = 0;
      const children = await this.repository.find({
        parent_id: item.id,
        company_id: context.company.id,
      });

      children.getEntities().forEach(async child => {
        initialSize += await this.calculateItemSize(child, context);
      });

      return initialSize;
    }

    return item.size;
  };
}
