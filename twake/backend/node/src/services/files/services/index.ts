import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { FileServiceAPI } from "../api";
import StorageAPI from "../../../core/platform/services/storage/provider";
import { Readable, Stream } from "stream";
import { File } from "../entities/file";
import Repository from "../../../../src/core/platform/services/database/services/orm/repository/repository";
import Multistream from "multistream";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { CompanyExecutionContext } from "../web/types";

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

  async init(context: TwakeContext): Promise<this> {
    try {
      this.repository = await this.database.getRepository<File>("files", File);
    } catch (err) {
      console.error("Error while initializing notification service", err);
    }
    return this;
  }

  async save(stream: any, context: CompanyExecutionContext) {
    const iv = "7b88ac42e1214474"; // ?
    const secret_key = "d04e7073dbbd609de83e8ba46a07b5d3"; // ?
    const userId = /*context.user.id ||*/ "9f939ec3-6a5b-4bba-893b-3b4481758a11";
    console.log("stream.id: ", stream.file_id);
    let entity = null;
    if (stream.file_id) {
      entity = await this.repository.findOne({
        company_id: stream.company_id,
        id: stream.file_id,
      });
      if (!entity) {
        throw "This file id does not exist";
      }
    }

    if (!entity) {
      entity = new File();
      entity.company_id = stream.company_id;
      entity.metadata = null;
      entity.thumbmail = null;

      // generer secret key ici
      entity.encryption_key = `${secret_key}.${iv}`;

      //recupérer user_id dans le context
      entity.user_id = "user_id";
      entity.application_id = null;
      entity.upload_data = null;

      this.repository.save(entity);
    }
    if (stream.data) {
      if (entity.upload_data?.size !== stream.fields["resumableTotalSize"]) {
        entity.metadata = {
          name: stream.fields["resumableFilename"],
          mime: stream.fields["resumableType"],
        };

        entity.upload_data = {
          size: stream.fields["resumableTotalSize"],
          chunks: stream.fields["resumableTotalChunks"],
        };
        this.repository.save(entity);
      }

      var cipher = createCipheriv(
        "aes-256-cbc",
        entity.encryption_key.split(".")[0],
        entity.encryption_key.split(".")[1],
      );

      //var decipher = createDecipheriv("aes-256-cbc", secret_key, iv);
      const newReadStream = stream.data.file.pipe(cipher);
      const bucket = "twake"; //récuperer bucket dans config coté storage
      const chunk_number = stream.fields["resumableChunkNumber"];
      const path = `/${bucket}/files/${entity.company_id}/${entity.user_id}/${stream.data.filename}/chunk${chunk_number}`;

      this.storage.write(path, newReadStream);
    }
    return entity;
  }

  async download(
    company_id: string,
    id: string,
    context: CompanyExecutionContext,
  ): Promise<Readable> {
    const entity = await this.repository.findOne({ company_id: company_id, id: id });

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

      const chunk = `twake/files/${company_id}/user_id/${entity.metadata.name}/chunk${count}`;
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

    return new Multistream(factory);
  }
}
