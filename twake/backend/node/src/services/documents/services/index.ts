import { getLogger, logger, TwakeLogger } from "../../../core/platform/framework";
import { CrudException } from "../../../core/platform/framework/api/crud-service";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { PublicFile } from "../../../services/files/entities/file";
import globalResolver from "../../../services/global-resolver";
import { hasCompanyAdminLevel } from "../../../utils/company";
import gr from "../../global-resolver";
import { DriveFile, TYPE } from "../entities/drive-file";
import { FileVersion, TYPE as FileVersionType } from "../entities/file-version";
import { CompanyExecutionContext, DriveItemDetails } from "../types";
import { getDefaultDriveItem, getDefaultDriveItemVersion } from "../utils";

type RootType = "root";
type TrashType = "trash";

export class DocumentsService {
  version: "1";
  repository: Repository<DriveFile>;
  fileVersionRepository: Repository<FileVersion>;
  ROOT: RootType = "root";
  TRASH: TrashType = "trash";
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

    id = id || this.ROOT;

    //Get requested entity
    const entity =
      id === this.ROOT || id === this.TRASH
        ? null
        : await this.repository.findOne(
            {
              company_id: context.company.id,
              id,
            },
            {},
            context,
          );

    if (!entity && !(id === this.ROOT || id === this.TRASH)) {
      this.logger.error("Drive item not found");
      throw new CrudException("Item not found", 404);
    }

    //Check access to entity
    try {
      const hasAccess = this.checkAccess(id, entity, "read", context);
      if (!hasAccess) {
        this.logger.error("user does not have access drive item ", id);
        throw Error("user does not have access to this item");
      }
    } catch (error) {
      this.logger.error("Failed to grant access to the drive item", error);
      throw new CrudException("User does not have access to this item or its children", 401);
    }

    const isDirectory = entity ? entity.is_directory : true;

    //Get entity version in case of a file
    const versions = isDirectory
      ? []
      : (
          await this.fileVersionRepository.find(
            {
              file_id: entity.id,
            },
            {},
            context,
          )
        ).getEntities();

    //Get children if it is a directory
    let children = isDirectory
      ? (
          await this.repository.find(
            {
              company_id: context.company.id,
              parent_id: id,
            },
            {},
            context,
          )
        ).getEntities()
      : [];

    //Check each children for access
    const accessMap: { [key: string]: boolean } = {};
    await Promise.all(
      children.map(async child => {
        accessMap[child.id] = await this.checkAccess(child.id, child, "read", context);
      }),
    );
    children = children.filter(child => accessMap[child.id]);

    //Return complete object
    return {
      path: await this.getPath(id, false, context),
      item:
        entity ||
        ({
          id,
          parent_id: null,
          name: id === this.ROOT ? "root" : id === this.TRASH ? "trash" : "unknown",
          size: await this.calculateItemSize(id === this.ROOT ? this.ROOT : "trash", context),
        } as DriveFile),
      versions: versions,
      children: children,
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

      const hasAccess = this.checkAccess(driveItem.parent_id, null, "write", context);
      if (!hasAccess) {
        this.logger.error("user does not have access drive item parent", driveItem.parent_id);
        throw Error("user does not have access to this item parent");
      }

      if (file) {
        driveItem.size = file.upload_data.size;
        driveItem.is_directory = false;
        driveItem.has_preview = true;
        driveItem.extension = file.metadata.name.split(".").pop();
        driveItemVersion.filename = driveItemVersion.filename || file.metadata.name;
        driveItemVersion.file_size = file.upload_data.size;
      }

      await this.fileVersionRepository.save(driveItemVersion);

      driveItem.last_version_cache = driveItemVersion;

      await this.repository.save(driveItem);
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
      const hasAccess = this.checkAccess(id, null, "write", context);

      if (!hasAccess) {
        this.logger.error("user does not have access drive item ", id);
        throw Error("user does not have access to this item");
      }

      const item = await this.repository.findOne({
        company_id: context.company.id,
        id,
      });

      if (!item) {
        this.logger.error("Drive item not found");
        throw Error("Item not found");
      }

      const driveItem = getDefaultDriveItem(content, context);
      await this.repository.save(driveItem);
      await this.updateItemSize(driveItem.parent_id, context);

      return driveItem;
    } catch (error) {
      this.logger.error("Failed to update drive item", error);
      throw new CrudException("Failed to update item", 500);
    }
  };

  /**
   * deletes or moves to Trash a Drive Document and its children
   *
   * @param {string} id - the item id
   * @param {CompanyExecutionContext} context - the execution context
   * @returns {Promise<void>}
   */
  delete = async (
    id: string | RootType | TrashType,
    item?: DriveFile,
    context?: CompanyExecutionContext,
  ): Promise<void> => {
    if (!id) {
      //We can't remove the root folder
      return;
    }

    //In the case of the trash we definitively delete the items
    if (id === "trash") {
      //Only administrators can execute this action
      const role = await gr.services.companies.getUserRole(context.company.id, context.user.id);
      if (hasCompanyAdminLevel(role) === false) {
        throw new CrudException("Only administrators can empty the trash", 403);
      }

      try {
        const itemsInTrash = await this.repository.find(
          {
            company_id: context.company.id,
            parent_id: "trash",
          },
          {},
          context,
        );
        await Promise.all(
          itemsInTrash.getEntities().map(async item => {
            await this.delete(item.id, item, context);
          }),
        );
      } catch (error) {
        this.logger.error("Failed to empty trash", error);
        throw new CrudException("Failed to empty trash", 500);
      }

      return;
    } else {
      item =
        item ||
        (await this.repository.findOne({
          company_id: context.company.id,
          id,
        }));

      if (!item) {
        this.logger.error("item to delete not found");
        throw new CrudException("Drive item not found", 404);
      }

      try {
        const hasAccess = this.checkAccess(item.id, item, "write", context);
        if (!hasAccess) {
          this.logger.error("user does not have access drive item ", id);
          throw Error("user does not have access to this item");
        }
      } catch (error) {
        this.logger.error("Failed to grant access to the drive item", error);
        throw new CrudException("User does not have access to this item or its children", 401);
      }

      const previousParentId = item.parent_id;
      if (
        item.parent_id === this.TRASH ||
        (await this.getPath(item.parent_id, true, context))[0].parent_id === this.TRASH
      ) {
        //This item is already in trash, we can delete it definitively

        if (item.is_directory) {
          //We delete the children
          const children = await this.repository.find(
            {
              company_id: context.company.id,
              parent_id: item.id,
            },
            {},
            context,
          );
          await Promise.all(
            children.getEntities().map(async child => {
              await this.delete(child.id, child, context);
            }),
          );
        } else {
          //Delete the version and stored file
          const itemVersions = await this.fileVersionRepository.find(
            {
              file_id: item.id,
            },
            {},
            context,
          );
          await Promise.all(
            itemVersions.getEntities().map(async version => {
              await this.fileVersionRepository.remove(version);
              await gr.services.files.delete(version.file_id, context);
            }),
          );
        }
        await this.repository.remove(item);
      } else {
        //This item is not in trash, we move it to trash
        item.parent_id = this.TRASH;
        await this.repository.save(item);
      }
      await this.updateItemSize(previousParentId, context);
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
      const hasAccess = this.checkAccess(id, null, "write", context);
      if (!hasAccess) {
        this.logger.error("user does not have access drive item ", id);
        throw Error("user does not have access to this item");
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
        throw Error("Drive item not found");
      }

      if (item.is_directory) {
        throw Error("cannot create version for a directory");
      }

      const driveItemVersion = getDefaultDriveItemVersion(version, context);
      await this.fileVersionRepository.save(driveItemVersion);

      item.last_version_cache = driveItemVersion;

      await this.repository.save(item);

      return driveItemVersion;
    } catch (error) {
      this.logger.error("Failed to create Drive item version", error);
      throw new CrudException("Failed to create Drive item version", 500);
    }
  };

  /**
   * Recalculates and updates the Drive item size
   *
   * @param {string} id - the item id
   * @param {CompanyExecutionContext} context - the execution context
   * @returns {Promise<void>}
   */
  private updateItemSize = async (id: string, context: CompanyExecutionContext): Promise<void> => {
    if (!id || id === this.ROOT || id === this.TRASH) return;

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
    item: DriveFile | TrashType | RootType,
    context: CompanyExecutionContext,
  ): Promise<number> => {
    if (item === this.TRASH) {
      let trashSize = 0;
      const trashedItems = await this.repository.find(
        { company_id: context.company.id, parent_id: this.TRASH },
        {},
        context,
      );

      trashedItems.getEntities().forEach(child => {
        trashSize += child.size;
      });

      return trashSize;
    }

    if (item === this.ROOT || !item) {
      let rootSize = 0;
      const rootFolderItems = await this.repository.find(
        { company_id: context.company.id, parent_id: this.ROOT },
        {},
        context,
      );

      await Promise.all(
        rootFolderItems.getEntities().map(async child => {
          rootSize += await this.calculateItemSize(child, context);
        }),
      );

      return rootSize;
    }

    if (item.is_directory) {
      let initialSize = 0;
      const children = await this.repository.find(
        {
          company_id: context.company.id,
          parent_id: item.id,
        },
        {},
        context,
      );

      Promise.all(
        children.getEntities().map(async child => {
          initialSize += await this.calculateItemSize(child, context);
        }),
      );

      return initialSize;
    }

    console.log("returning", item.size);

    return item.size;
  };

  /**
   * Checks if the current user has access to a drive item.
   *
   * @param {string} id - the drive item id.
   * @param {CompanyExecutionContext} context - the execution context.
   * @returns {Promise<boolean>} - whether the current user has access to the item or not.
   */
  private checkAccess = async (
    id: string,
    item: DriveFile | null,
    level: "read" | "write" | "manage",
    context: CompanyExecutionContext,
    token?: string,
  ): Promise<boolean> => {
    if (!id || id === this.ROOT || id === this.TRASH) return true;

    try {
      item =
        item ||
        (await this.repository.findOne({
          id,
          company_id: context.company.id,
        }));

      if (!item) {
        logger.error("Drive item doesn't exist");
        throw Error("Drive item doesn't exist");
      }

      if (token) {
        if (!item.access_info.public.token) {
          return false;
        }

        const { token: itemToken, level: itemLevel } = item.access_info.public;

        return itemLevel === level && itemToken === token;
      }

      if (
        !item.access_info.entities.find(entity => {
          if (entity.level !== level) return false;

          if (entity.type === "user" && entity.id === context.user.id) {
            return true;
          }

          if (entity.type === "company" && entity.id === context.company.id) {
            return true;
          }

          return false;
        })
      ) {
        return false;
      }

      if (!item.is_directory) return true;

      const children = await this.repository.find({
        parent_id: id,
        company: context.company.id,
      });

      return children.getEntities().every(child => {
        return this.checkAccess(child.id, child, level, context, token);
      });
    } catch (error) {
      logger.error("failed to check Drive item access", error);
      throw Error(error);
    }
  };

  private getPath = async (
    id: string,
    ignoreAccess?: boolean,
    context?: CompanyExecutionContext,
  ): Promise<DriveFile[]> => {
    id = id || this.ROOT;
    if (id === this.ROOT || id === this.TRASH) return [];

    const item = await this.repository.findOne({
      id,
      company_id: context.company.id,
    });

    if (!item || (!this.checkAccess(id, item, "read", context) && !ignoreAccess)) {
      return [];
    }

    return [...(await this.getPath(item.parent_id, ignoreAccess, context)), item];
  };
}
