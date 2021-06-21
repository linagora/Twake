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

  constructor(
    readonly database: DatabaseServiceAPI,
    readonly pubsub: PubsubServiceAPI,
    readonly storage: StorageAPI,
  ) {}

  async init(): Promise<this> {
    try {
      this.repository = await this.database.getRepository<File>("files", File);
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
    const applicationId: string | null = context.user.application_id || null;

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
          entity.upload_data?.size !== options.totalSize ||
          entity.metadata?.name !== options.filename
        ) {
          entity.metadata = {
            name: options.filename,
            mime: options.type,
          };
          entity.upload_data = {
            size: options.totalSize,
            chunks: options.totalChunks,
          };
          this.repository.save(entity);
        }
      }

      const [key, iv] = entity.encryption_key.split(".");
      const cipher = createCipheriv(this.algorithm, key, iv);
      const newReadStream = file.file.pipe(cipher);
      const chunk_number = options.chunkNumber;
      const path = `${getFilePath(entity)}/chunk${chunk_number}`;

      const res = await this.storage.write(path, newReadStream);

      console.log("end size: ", res);

      //When we get chunk size after on, we need to update the file entity
      if (res.size && entity.upload_data?.chunks === 1) {
        entity.upload_data.size = res.size;
        this.repository.save(entity);
      }
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
  return `/twake/files/${entity.company_id}/${entity.user_id}/${entity.id}`;
}
