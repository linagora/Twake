import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { FileServiceAPI } from "../api";
import StorageAPI from "../../../core/platform/services/storage/provider";

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
      //await Promise.all([this.file.init(context)]);
    } catch (err) {
      console.error("Error while initializing notification service", err);
    }
    return this;
  }

  save(stream: any) {
    this.storage.write(stream.fields, stream);
  }
}
