import { randomBytes } from "crypto";
import { Readable } from "stream";
import { Multipart } from "fastify-multipart";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { FileServiceAPI, UploadOptions } from "../api";
import StorageAPI from "../../../core/platform/services/storage/provider";
import { File } from "../entities/file";
import Repository from "../../../../src/core/platform/services/database/services/orm/repository/repository";
import { CompanyExecutionContext } from "../web/types";
import { logger } from "../../../core/platform/framework";
import {
  PreviewClearPubsubRequest,
  PreviewPubsubRequest,
} from "../../../../src/services/previews/types";
import { PreviewFinishedProcessor } from "./preview";
import _ from "lodash";
import { getDownloadRoute, getThumbnailRoute } from "../web/routes";
import { DeleteResult, CrudExeption } from "../../../core/platform/framework/api/crud-service";

export function getService(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
  storage: StorageAPI,
): FileServiceAPI {
  return getServiceInstance(databaseService, pubsub, storage);
}

function getServiceInstance(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
  storage: StorageAPI,
): FileServiceAPI {
  return new Service(databaseService, pubsub, storage);
}

class Service implements FileServiceAPI {
  version: "1";
  repository: Repository<File>;
  private algorithm = "aes-256-cbc";
  private max_preview_file_size = 50000000;
  pubsub: PubsubServiceAPI;

  constructor(
    readonly database: DatabaseServiceAPI,
    pubsub: PubsubServiceAPI,
    readonly storage: StorageAPI,
  ) {
    this.pubsub = pubsub;
  }

  async init(): Promise<this> {
    try {
      await Promise.all([
        (this.repository = await this.database.getRepository<File>("files", File)),
        this.pubsub.processor.addHandler(
          new PreviewFinishedProcessor(this, this.pubsub, this.repository),
        ),
      ]);
    } catch (err) {
      logger.error("Error while initializing files service", err);
    }
    return this;
  }

  async save(
    id: string,
    file: Multipart,
    options: UploadOptions,
    context: CompanyExecutionContext,
  ): Promise<File> {
    const userId = context.user?.id;
    const applicationId: string | null = context.user?.application_id || null;

    let entity: File = null;
    if (id) {
      entity = await this.repository.findOne({
        company_id: context.company.id,
        id: id,
      });
      if (!entity) {
        throw new Error(`This file ${id} does not exist`);
      }
    }

    if (!entity) {
      entity = new File();
      entity.company_id = `${context.company.id}`;
      entity.metadata = null;
      entity.thumbnails = [];

      const iv = randomBytes(8).toString("hex");
      const secret_key = randomBytes(16).toString("hex");
      entity.encryption_key = `${secret_key}.${iv}`;

      entity.user_id = userId;
      entity.application_id = applicationId;
      entity.upload_data = null;

      this.repository.save(entity);
    }

    if (file) {
      // Detect a new file upload
      // Only applications can overwrite a file.
      // Users alone can only write an empty file.
      if (applicationId || !entity.upload_data?.size || context.user.server_request) {
        if (
          //If there was any change to the file
          entity.upload_data?.size !== options.totalSize ||
          entity.metadata?.name !== options.filename
        ) {
          entity.metadata = {
            name: options.filename,
            mime: options.type,
            thumbnails_status: "done",
          };
          entity.upload_data = {
            size: options.totalSize,
            chunks: options.totalChunks || 1,
          };
          this.repository.save(entity);
        }
      }

      let totalUploadedSize = 0;
      file.file.on("data", function (chunk) {
        totalUploadedSize += chunk.length;
      });
      await this.storage.write(getFilePath(entity), file.file, {
        chunkNumber: options.chunkNumber,
        encryptionAlgo: this.algorithm,
        encryptionKey: entity.encryption_key,
      });

      if (entity.upload_data.chunks === 1 && totalUploadedSize) {
        entity.upload_data.size = totalUploadedSize;
        await this.repository.save(entity);
      }

      //Fixme: detect in multichunk when all chunks are uploaded to trigger this. For now we do only single chunks for preview
      if (entity.upload_data.chunks === 1 && totalUploadedSize) {
        /** Send preview generation task */
        if (entity.upload_data.size < this.max_preview_file_size) {
          const document: PreviewPubsubRequest["document"] = {
            id: JSON.stringify(_.pick(entity, "id", "company_id")),
            provider: this.storage.getConnectorType(),

            path: getFilePath(entity),
            encryption_algo: this.algorithm,
            encryption_key: entity.encryption_key,
            chunks: entity.upload_data.chunks,

            filename: entity.metadata.name,
            mime: entity.metadata.mime,
          };
          const output = {
            provider: this.storage.getConnectorType(),
            path: `${getFilePath(entity)}/thumbnails/`,
            encryption_algo: this.algorithm,
            encryption_key: entity.encryption_key,
            pages: 10,
          };

          entity.metadata.thumbnails_status = "waiting";
          await this.repository.save(entity);

          try {
            await this.pubsub.publish<PreviewPubsubRequest>("services:preview", {
              data: { document, output },
            });

            if (options.waitForThumbnail) {
              for (let i = 1; i < 10; i++) {
                entity = await this.repository.findOne({
                  company_id: context.company.id,
                  id: id,
                });
                if (entity.metadata.thumbnails_status === "done") {
                  break;
                }
                await new Promise(r => setTimeout(r, i * 200));
              }
            }
          } catch (err) {
            entity.metadata.thumbnails_status = "error";
            await this.repository.save(entity);

            logger.warn({ err }, "Previewing - Error while sending ");
          }
        }

        /** End preview generation task generation */
      }
    }

    return entity;
  }

  async download(
    id: string,
    context: CompanyExecutionContext,
  ): Promise<{ file: Readable; name: string; mime: string; size: number }> {
    const entity = await this.repository.findOne({ company_id: context.company.id, id: id });
    if (!entity) {
      throw "File not found";
    }

    const readable = await this.storage.read(getFilePath(entity), {
      totalChunks: entity.upload_data.chunks,
      encryptionAlgo: this.algorithm,
      encryptionKey: entity.encryption_key,
    });

    return {
      file: readable,
      name: entity.metadata.name,
      mime: entity.metadata.mime,
      size: entity.upload_data.size,
    };
  }

  async thumbnail(
    id: string,
    index: string,
    context: CompanyExecutionContext,
  ): Promise<{ file: Readable; type: string; size: number }> {
    const entity = await this.repository.findOne({ company_id: context.company.id, id: id });

    if (!entity) {
      throw "File not found";
    }

    const thumbnail = entity.thumbnails[parseInt(index)];
    if (!thumbnail) {
      throw `Thumbnail ${parseInt(index)} not found`;
    }

    const thumbnailPath = `${getFilePath(entity)}/thumbnails/${thumbnail.id}`;

    const readable = await this.storage.read(thumbnailPath, {
      encryptionAlgo: this.algorithm,
      encryptionKey: entity.encryption_key,
    });

    return {
      file: readable,
      type: thumbnail.type,
      size: thumbnail.size,
    };
  }

  get(id: string, context: CompanyExecutionContext): Promise<File> {
    return this.repository.findOne({ id, company_id: context.company.id });
  }

  getThumbnailRoute(file: File, index: string) {
    return getThumbnailRoute(file, index);
  }

  getDownloadRoute(file: File) {
    return getDownloadRoute(file);
  }

  async delete(id: string, context: CompanyExecutionContext): Promise<DeleteResult<File>> {
    const fileToDelete = await this.repository.findOne({ id, company_id: context.company.id });

    if (!fileToDelete) {
      throw new CrudExeption("File not found", 404);
    }

    await this.repository.remove(fileToDelete);

    const path = getFilePath(fileToDelete);

    await this.storage.delete(path, {
      totalChunks: fileToDelete.upload_data.chunks,
    });

    if (fileToDelete.thumbnails.length > 0) {
      await this.pubsub.publish<PreviewClearPubsubRequest>("services:preview:clear", {
        data: {
          document: {
            id: JSON.stringify(_.pick(fileToDelete, "id", "company_id")),
            provider: this.storage.getConnectorType(),
            path: `${path}/thumbnails/`,
            thumbnails_number: fileToDelete.thumbnails.length,
          },
        },
      });
    }

    return new DeleteResult("files", fileToDelete, true);
  }
}

function getFilePath(entity: File): string {
  return `/twake/files/${entity.company_id}/${entity.user_id || "anonymous"}/${entity.id}`;
}
