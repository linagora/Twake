import { getLogger, logger, TwakeLogger } from "../../../core/platform/framework";
import { CrudException } from "../../../core/platform/framework/api/crud-service";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { PublicFile } from "../../../services/files/entities/file";
import globalResolver from "../../../services/global-resolver";
import { hasCompanyAdminLevel } from "../../../utils/company";
import gr from "../../global-resolver";
import { DriveFile, TYPE } from "../entities/drive-file";
import { FileVersion, TYPE as FileVersionType } from "../entities/file-version";
import { CompanyExecutionContext, DriveItemDetails, RootType, TrashType } from "../types";
import {
  addDriveItemToArchive,
  calculateItemSize,
  checkAccess,
  getDefaultDriveItem,
  getDefaultDriveItemVersion,
  getPath,
  updateItemSize,
} from "../utils";
import { websocketEventBus } from "../../../core/platform/services/realtime/bus";

import archiver from "archiver";
import internal from "stream";
import { RealtimeEntityActionType, ResourcePath } from "src/core/platform/services/realtime/types";

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
      const hasAccess = await checkAccess(id, entity, "read", this.repository, context);
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
        accessMap[child.id] = await checkAccess(child.id, child, "read", this.repository, context);
      }),
    );
    children = children.filter(child => accessMap[child.id]);

    //Return complete object
    return {
      path: await getPath(id, this.repository, false, context),
      item:
        entity ||
        ({
          id,
          parent_id: null,
          name: id === this.ROOT ? "root" : id === this.TRASH ? "trash" : "unknown",
          size: await calculateItemSize(
            id === this.ROOT ? this.ROOT : "trash",
            this.repository,
            context,
          ),
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

      const hasAccess = await checkAccess(
        driveItem.parent_id,
        null,
        "write",
        this.repository,
        context,
      );
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
        driveItemVersion.file_id = file.id;
      }

      await this.fileVersionRepository.save(driveItemVersion);

      driveItem.last_version_cache = driveItemVersion;

      await this.repository.save(driveItem);
      await updateItemSize(driveItem.parent_id, this.repository, context);

      this.notifyWebsocket(driveItem.parent_id, context);

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
      const hasAccess = await checkAccess(id, null, "write", this.repository, context);

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
      await updateItemSize(driveItem.parent_id, this.repository, context);

      this.notifyWebsocket(driveItem.parent_id, context);

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
        if (!(await checkAccess(item.id, item, "write", this.repository, context))) {
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
        (await getPath(item.parent_id, this.repository, true, context))[0].parent_id === this.TRASH
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
      await updateItemSize(previousParentId, this.repository, context);

      this.notifyWebsocket(previousParentId, context);
    }

    this.notifyWebsocket("trash", context);
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
      const hasAccess = await checkAccess(id, null, "write", this.repository, context);
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

      this.notifyWebsocket(item.parent_id, context);

      return driveItemVersion;
    } catch (error) {
      this.logger.error("Failed to create Drive item version", error);
      throw new CrudException("Failed to create Drive item version", 500);
    }
  };

  download = async (
    id: string,
    versionId: string | null,
    context: CompanyExecutionContext,
  ): Promise<{
    archive?: archiver.Archiver;
    file?: {
      file: internal.Readable;
      name: string;
      mime: string;
      size: number;
    };
  }> => {
    const item = await this.get(id, context);

    if (item.item.is_directory) {
      return { archive: await this.createZip([id], context) };
    }

    let version = item.item.last_version_cache;
    if (versionId) version = item.versions.find(version => version.id === versionId);
    if (!version) {
      throw new CrudException("Version not found", 404);
    }

    const fileId = version.file_id;
    const file = await globalResolver.services.files.download(fileId, context);

    return { file };
  };

  /**
   * Creates a zip archive containing the drive items.
   *
   * @param {string[]} ids - the drive item list
   * @param {CompanyExecutionContext} context - the execution context
   * @returns {Promise<archiver.Archiver>} the created archive.
   */
  createZip = async (
    ids: string[] = [],
    context: CompanyExecutionContext,
  ): Promise<archiver.Archiver> => {
    if (!context) {
      this.logger.error("invalid execution context");
      return null;
    }

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    await Promise.all(
      ids.map(async id => {
        if (!(await checkAccess(id, null, "read", this.repository, context))) {
          this.logger.warn(`not enough permissions to download ${id}, skipping`);
          return;
        }

        try {
          await addDriveItemToArchive(id, null, archive, this.repository, context);
        } catch (error) {
          this.logger.warn("failed to add item to archive", error);
          throw new Error("Failed to add item to archive");
        }
      }),
    );

    return archive;
  };

  notifyWebsocket = async (id: string, context: CompanyExecutionContext) => {
    websocketEventBus.publish(RealtimeEntityActionType.Event, {
      type: "documents:updated",
      room: ResourcePath.get(`/companies/${context.company.id}/documents/item/${id}`),
      entity: {
        companyId: context.company.id,
        id: id,
      },
      resourcePath: null,
      result: null,
    });
  };
}
