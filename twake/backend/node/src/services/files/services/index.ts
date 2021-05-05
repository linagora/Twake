import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { FileServiceAPI } from "../api";
import StorageAPI from "../../../core/platform/services/storage/provider";
import { Readable, Stream } from "stream";
import { File } from "../entities/file";
import Repository from "../../../../src/core/platform/services/database/services/orm/repository/repository";
import Multistream from "multistream";

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

  //file: FileServiceAPI;

  constructor(
    readonly database: DatabaseServiceAPI,
    readonly pubsub: PubsubServiceAPI,
    readonly storage: StorageAPI,
  ) {
    //this.file = getFileService(this.database);
  }

  async init(context: TwakeContext): Promise<this> {
    try {
      this.repository = await this.database.getRepository<File>("files", File);
      //await Promise.all([this.file.init(context)]);
    } catch (err) {
      console.error("Error while initializing notification service", err);
    }
    return this;
  }

  async save(stream: any) {
    const entity = new File();
    entity.company_id = stream.company_id;
    entity.metadata = {
      name: stream.fields["resumableFilename"],
      extension: stream.fields["resumableFilename"].split(".").pop(),
      thumbmail: "",
      type: stream.fields["resumableType"],
    };
    entity.cipher = "";
    entity.owner_id = "9f939ec3-6a5b-4bba-893b-3b4481758a11";
    entity.owner_type = "user";
    console.log("fields", stream.fields["resumableTotalSize"]);
    console.log("entity", entity.metadata);

    entity.upload_data = {
      size: stream.fields["resumableTotalSize"],
      chunks: stream.fields["resumableTotalChunks"],
    };

    console.log("entity", entity);

    await this.repository.save(entity);
    this.storage.write(stream.fields, stream);
  }

  async download(company_id: string, id: string): Promise<Readable> {
    const entity = await this.repository.findOne({ company_id: company_id, id: id });
    console.log("entity", entity);
    const chunks = entity.upload_data.chunks;
    console.log("number of chunks", chunks);
    var count = 1;
    let stream;
    const self = this;

    async function factory(callback: (err?: Error, stream?: Stream) => {}) {
      if (count > chunks) return callback();

      const chunk = `twake/files/${company_id}/user_id/${entity.metadata.name}/chunk${count}`;
      count++;
      try {
        //console.log("chunk", chunk);
        stream = await self.storage.read(chunk);
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
// pre process
//route actuelle en pre process
//upload dans le ficheir de pre process
