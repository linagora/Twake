import { Stream } from "stream";
import { Consumes, TwakeService } from "../../framework";
import S3ConnectorService from "./connectors/S3/service";

import StorageAPI, { StorageConnectorAPI } from "./provider";

@Consumes([])
export default class StorageService extends TwakeService<StorageAPI> implements StorageAPI {
  name = "storage";
  version = "1";

  api(): StorageAPI {
    return this;
  }

  getConnector(): StorageConnectorAPI {
    return new S3ConnectorService(this.configuration.get<any>("S3"));
  }

  write(path: string, stream: Stream): boolean {
    return this.getConnector().write(path, stream);
  }

  read(path: string): Stream {
    return this.getConnector().read(path);
  }

  async doStart(): Promise<this> {
    //When the service starts
    return this;
  }

  async doInit(): Promise<this> {
    //When service is initialized
    return this;
  }
}
