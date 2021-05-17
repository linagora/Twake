import { Stream, Readable } from "stream";
import { Consumes, logger, TwakeService } from "../../framework";
import LocalConnectorService, { LocalConfiguration } from "./connectors/local/service";
import S3ConnectorService, { S3Configuration } from "./connectors/S3/service";

import StorageAPI, { StorageConnectorAPI } from "./provider";

@Consumes([])
export default class StorageService extends TwakeService<StorageAPI> implements StorageAPI {
  name = "storage";
  version = "1";

  api(): StorageAPI {
    return this;
  }

  getConnector(): StorageConnectorAPI {
    const type = this.configuration.get<string>("type");
    if (type === "S3") {
      logger.info("Using 'S3' connector for storage.");
      return new S3ConnectorService(this.configuration.get<S3Configuration>("S3"));
    }
    logger.info(
      "Using 'local' connector for storage (no other connector recognized from configuration type: '%s').",
      type,
    );
    return new LocalConnectorService(this.configuration.get<LocalConfiguration>("local"));
  }

  write(path: string, stream: Stream) {
    this.getConnector().write(path, stream);
  }

  read(path: string): Promise<Readable> {
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
