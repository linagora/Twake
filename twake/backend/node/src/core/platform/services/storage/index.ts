import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { isBuffer } from "lodash";
import { Stream, Readable } from "stream";
import { Consumes, logger, TwakeService } from "../../framework";
import LocalConnectorService, { LocalConfiguration } from "./connectors/local/service";
import S3ConnectorService, { S3Configuration } from "./connectors/S3/service";

import StorageAPI, { StorageConnectorAPI } from "./provider";

@Consumes([])
export default class StorageService extends TwakeService<StorageAPI> implements StorageAPI {
  name = "storage";
  version = "1";

  globalEncryption: { secret: string | null; iv: string | null } = { secret: null, iv: null };

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
    if (this.globalEncryption.secret) {
      try {
        const cipher = createCipheriv(
          "aes-256-cbc",
          this.globalEncryption.secret,
          this.globalEncryption.iv,
        );
        stream = stream.pipe(cipher);
      } catch (err) {
        logger.error("Unable to createDecipheriv: %s", err);
      }
    }
    this.getConnector().write(path, stream);
  }

  async read(path: string): Promise<Readable> {
    let stream = await this.getConnector().read(path);
    if (this.globalEncryption.secret) {
      try {
        const decipher = createDecipheriv(
          "aes-256-cbc",
          this.globalEncryption.secret,
          this.globalEncryption.iv,
        );
        stream = stream.pipe(decipher);
      } catch (err) {
        logger.error("Unable to createDecipheriv: %s", err);
      }
    }
    return stream;
  }

  async doStart(): Promise<this> {
    //When the service starts
    return this;
  }

  async doInit(): Promise<this> {
    this.globalEncryption.secret = this.configuration.get<string | null>("secret", null);
    this.globalEncryption.iv = this.configuration.get<string>("iv", "0123456789abcdef");

    return this;
  }
}
