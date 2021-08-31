import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { Readable, Stream } from "stream";
import { Multipart } from "fastify-multipart";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { FileServiceAPI, UploadOptions } from "../api";
import StorageAPI from "../../../core/platform/services/storage/provider";
import { File } from "../entities/file";
import Repository from "../../../../src/core/platform/services/database/services/orm/repository/repository";
import { CompanyExecutionContext } from "../web/types";
import { logger } from "../../../core/platform/framework";
import { PreviewPubsubRequest } from "../../../../src/services/previews/types";
import { PreviewFinishedProcessor } from "./preview";

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
        this.pubsub.processor.addHandler(new PreviewFinishedProcessor(this, this.pubsub)),
        (this.repository = await this.database.getRepository<File>("files", File)),
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
      entity.thumbmail = null;

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
      // Only applications car overwrite a file.
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

      console.log(totalUploadedSize);

      if (entity.upload_data.chunks === 1 && totalUploadedSize) {
        entity.upload_data.size = totalUploadedSize;
        await this.repository.save(entity);
      }
    }

    //TODO: when all chunks are uploaded
    /** Send preview generation task */
    if (entity.upload_data.size < this.max_preview_file_size) {
      const document: PreviewPubsubRequest["document"] = {
        id: entity.id,
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
      try {
        this.pubsub.publish<PreviewPubsubRequest>("services:preview", {
          data: { document, output },
        });
      } catch (err) {
        logger.warn({ err }, `Previewing - Error while sending `);
      }
    }
    /** End preview generation task generation */

    return entity;
  }

  async download(
    id: string,
    context: CompanyExecutionContext,
  ): Promise<{ file: Readable; name: string; mime: string; size: number }> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const entity = await this.repository.findOne({ company_id: context.company.id, id: id });

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

  async get(id: string, context: CompanyExecutionContext): Promise<File> {
    return this.repository.findOne({ company_id: context.company.id, id });
  }
}

function getFilePath(entity: File): string {
  return `/twake/files/${entity.company_id}/${entity.user_id || "anonymous"}/${entity.id}`;
}
