import { createCipheriv, createDecipheriv, Decipher } from "crypto";
import { Stream, Readable } from "stream";
import Multistream from "multistream";
import { Consumes, logger, TwakeService } from "../../framework";
import LocalConnectorService, { LocalConfiguration } from "./connectors/local/service";
import S3ConnectorService, { S3Configuration } from "./connectors/S3/service";
import StorageAPI, {
  DeleteOptions,
  ReadOptions,
  StorageConnectorAPI,
  WriteMetadata,
  WriteOptions,
} from "./provider";

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

  getConnectorType(): string {
    return this.configuration.get<string>("type");
  }

  getConnector(): StorageConnectorAPI {
    const type = this.getConnectorType();
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

  async write(path: string, stream: Stream, options?: WriteOptions): Promise<WriteMetadata> {
    try {
      if (options.encryptionKey) {
        const [key, iv] = options.encryptionKey.split(".");
        const cipher = createCipheriv(options.encryptionAlgo, key, iv);
        stream = stream.pipe(cipher);
      }
      if (options.chunkNumber) path = `${path}/chunk${options.chunkNumber}`;

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
      return await this.getConnector().write(path, stream);
    } catch (err) {
      logger.error(err);
      return null;
    }
  }

  async read(path: string, options?: ReadOptions): Promise<Readable> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;

      let decipher: Decipher;
      if (options.encryptionKey) {
        const [key, iv] = options.encryptionKey.split(".");
        decipher = createDecipheriv(options.encryptionAlgo, key, iv);
      }

      const chunks = options.totalChunks || 1;
      let count = 1;
      let stream;
      async function factory(callback: (err?: Error, stream?: Stream) => unknown) {
        if (count > chunks) {
          callback();
          return;
        }

        const chunk = options.totalChunks ? `${path}/chunk${count}` : path;
        count += 1;

        try {
          stream = await self._read(chunk);
          if (decipher) {
            stream = stream.pipe(decipher);
          }
        } catch (err) {
          logger.error(err);
          callback();
          return;
        }
        callback(null, stream);
        return;
      }

      return new Multistream(factory);
    } catch (err) {
      logger.error(err);
      return null;
    }
  }

  async _read(path: string): Promise<Readable> {
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

  async remove(path: string, options?: DeleteOptions) {
    try {
      for (let count = 1; count <= options.totalChunks || 1; count++) {
        const chunk = options.totalChunks ? `${path}/chunk${count}` : path;
        await this.getConnector().remove(chunk);
      }
      return true;
    } catch (err) {
      logger.error("Unable to remove file %s", err);
    }
    return false;
  }

  async doInit(): Promise<this> {
    this.encryptionOptions = {
      secret: this.configuration.get<string>("secret", null),
      iv: this.configuration.get<string>("iv", null),
    };

    return this;
  }
}
