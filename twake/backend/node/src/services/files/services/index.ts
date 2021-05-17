import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { FileServiceAPI, UploadOptions } from "../api";
import StorageAPI from "../../../core/platform/services/storage/provider";
import { Readable, Stream } from "stream";
import { File } from "../entities/file";
import Repository from "../../../../src/core/platform/services/database/services/orm/repository/repository";
import Multistream from "multistream";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { CompanyExecutionContext } from "../web/types";
import { Multipart } from "fastify-multipart";

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

  constructor(
    readonly database: DatabaseServiceAPI,
    readonly pubsub: PubsubServiceAPI,
    readonly storage: StorageAPI,
  ) {}

  async init(): Promise<this> {
    try {
      this.repository = await this.database.getRepository<File>("files", File);
    } catch (err) {
      console.error("Error while initializing notification service", err);
    }
    return this;
  }

  async save(
    id: string,
    file: Multipart,
    options: UploadOptions,
    context: CompanyExecutionContext,
  ) {
    const userId = context.user?.id;
    const applicationId: string | null = context.app?.id || null;

    let entity = null;
    if (id) {
      entity = await this.repository.findOne({
        company_id: context.company.id,
        id: id,
      });
      if (!entity) {
        throw "This file id does not exist";
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
      //Detect a new file upload
      // Only applications car overwrite a file.
      // Users alone can only write an empty file.
      if (applicationId || !entity.upload_data?.size || context.serverRequest) {
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

      var cipher = createCipheriv(
        "aes-256-cbc",
        entity.encryption_key.split(".")[0],
        entity.encryption_key.split(".")[1],
      );

      const newReadStream = file.file.pipe(cipher);
      const chunk_number = options.chunkNumber;
      const path = `${getFilePath(entity)}/chunk${chunk_number}`;

      this.storage.write(path, newReadStream);
    }
    return entity;
  }

  async download(
    id: string,
    context: CompanyExecutionContext,
  ): Promise<{ file: Readable; name: string; mime: string; size: number }> {
    const entity = await this.repository.findOne({ company_id: context.company.id, id: id });

    const chunks = entity.upload_data.chunks;
    var count = 1;
    let stream;
    const self = this;

    async function factory(callback: (err?: Error, stream?: Stream) => {}) {
      if (count > chunks) return callback();
      var decipher = createDecipheriv(
        "aes-256-cbc",
        entity.encryption_key.split(".")[0],
        entity.encryption_key.split(".")[1],
      );

      const chunk = `${getFilePath(entity)}/chunk${count}`;
      count++;
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
    const entity = await this.repository.findOne({ company_id: context.company.id, id: id });
    return entity;
  }
}

function getFilePath(entity: File): string {
  return `/twake/files/${entity.company_id}/${entity.user_id}/${entity.id}`;
}
