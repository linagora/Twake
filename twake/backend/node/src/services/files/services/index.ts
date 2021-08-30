import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { Readable, Stream } from "stream";
import Multistream from "multistream";
import { Multipart } from "fastify-multipart";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { FileServiceAPI, UploadOptions } from "../api";
import StorageAPI from "../../../core/platform/services/storage/provider";
import { File } from "../entities/file";
import Repository from "../../../../src/core/platform/services/database/services/orm/repository/repository";
import { CompanyExecutionContext } from "../web/types";
import { logger } from "../../../core/platform/framework";
import { FileEngine } from "./engine";
import { PreviewPubsubRequest } from "../../../../src/services/previews/types";

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
  engine: FileEngine;
  pubsub: PubsubServiceAPI;

  constructor(
    readonly database: DatabaseServiceAPI,
    pubsub: PubsubServiceAPI,
    readonly storage: StorageAPI,
  ) {
    this.engine = new FileEngine(this, pubsub);
    this.pubsub = pubsub;
  }

  async init(): Promise<this> {
    try {
      await Promise.all([
        this.engine.init(),
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

      const [key, iv] = entity.encryption_key.split(".");
      const cipher = createCipheriv(this.algorithm, key, iv);
      const newReadStream = file.file.pipe(cipher);
      const chunk_number = options.chunkNumber;
      const path = `${getFilePath(entity)}/chunk${chunk_number}`;
      console.log("?????????????????????????????????????", getFilePath(entity));
      await this.storage.write(path, newReadStream);

      console.log(totalUploadedSize);

      if (entity.upload_data.chunks === 1 && totalUploadedSize) {
        entity.upload_data.size = totalUploadedSize;
        await this.repository.save(entity);
      }
    }
    const document: PreviewPubsubRequest["document"] = {
      id: entity.id,
      path: getFilePath(entity),
      provider: "local",
      filename: entity.metadata.name,
      mime: entity.metadata.mime,
    };
    const output = { path: "/usr/src/app/src/services/previews/", provider: "local", pages: 10 };
    try {
      this.pubsub.publish<PreviewPubsubRequest>("services:preview", {
        data: { document, output },
      });
    } catch (err) {
      logger.warn({ err }, `Previewing - Error while sending `);
    }

    return entity;
  }

  async download(
    id: string,
    context: CompanyExecutionContext,
  ): Promise<{ file: Readable; name: string; mime: string; size: number }> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const entity = await this.repository.findOne({ company_id: context.company.id, id: id });
    const [key, iv] = entity.encryption_key.split(".");
    const decipher = createDecipheriv(this.algorithm, key, iv);
    const chunks = entity.upload_data.chunks;
    let count = 1;
    let stream;

    async function factory(callback: (err?: Error, stream?: Stream) => unknown) {
      if (count > chunks) {
        callback();
        return;
      }
      const chunk = `${getFilePath(entity)}/chunk${count++}`;

      try {
        stream = (await self.storage.read(chunk)).pipe(decipher);
      } catch (err) {
        callback(new Error(`No such chunk ${chunk}`));
        return;
      }
      callback(null, stream);
      return;
    }

    return {
      file: new Multistream(factory),
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
  // CARE: do not push with userID hardcoded
  return `/twake/files/${entity.company_id}/bcfe2f79-8e81-42a3-b551-3a32d49b2b4d/${entity.id}`; //${entity.user_id}/${entity.id}`;
}
