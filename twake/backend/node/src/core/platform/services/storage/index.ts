import { createCipheriv, createDecipheriv } from "crypto";
import { Stream, Readable } from "stream";
import { Consumes, logger, TwakeService } from "../../framework";
import LocalConnectorService, { LocalConfiguration } from "./connectors/local/service";
import S3ConnectorService, { S3Configuration } from "./connectors/S3/service";
import StorageAPI, { StorageConnectorAPI } from "./provider";

type EncryptionConfiguration = {
  secret: string | null;
  iv: string | null;
};
@Consumes([])
export default class StorageService extends TwakeService<StorageAPI> implements StorageAPI {
  name = "storage";
  version = "1";

  private encryptionOptions: EncryptionConfiguration;
  private algorithm = "aes-256-cbc";

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
      `Using 'local' connector for storage${
        type === "local" ? "" : " (no other connector recognized from configuration type: '%s')"
      }.`,
      type,
    );
    return new LocalConnectorService(this.configuration.get<LocalConfiguration>("local"));
  }

  write(path: string, stream: Stream): void {
    if (this.encryptionOptions.secret) {
      try {
        const cipher = createCipheriv(
          this.algorithm,
          this.encryptionOptions.secret,
          this.encryptionOptions.iv,
        );
        stream = stream.pipe(cipher);
      } catch (err) {
        logger.error("Unable to createCipheriv: %s", err);
      }
    }
    this.getConnector().write(path, stream);
  }

  async read(path: string): Promise<Readable> {
    let stream = await this.getConnector().read(path);
    if (this.encryptionOptions.secret) {
      try {
        const decipher = createDecipheriv(
          this.algorithm,
          this.encryptionOptions.secret,
          this.encryptionOptions.iv,
        );
        stream = stream.pipe(decipher);
      } catch (err) {
        logger.error("Unable to createDecipheriv: %s", err);
      }
    }
    return stream;
  }

  async doInit(): Promise<this> {
    this.encryptionOptions = {
      secret: this.configuration.get<string>("secret", null),
      iv: this.configuration.get<string>("iv", null),
    };

    return this;
  }
}
