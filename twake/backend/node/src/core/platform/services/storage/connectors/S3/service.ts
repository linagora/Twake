import * as Minio from "minio";
import { logger } from "../../../../../../core/platform/framework";
import { Readable } from "stream";
import { StorageConnectorAPI, WriteMetadata } from "../../provider";

export type S3Configuration = Minio.ClientOptions & { bucket: string };

export default class S3ConnectorService implements StorageConnectorAPI {
  client: Minio.Client;
  minioConfiguration: S3Configuration;

  constructor(S3Configuration: S3Configuration) {
    this.client = new Minio.Client({ ...S3Configuration });
    this.minioConfiguration = S3Configuration;
  }

  write(path: string, stream: Readable): Promise<WriteMetadata> {
    let totalSize = 0;
    return new Promise(resolve => {
      stream
        .on("data", function (chunk) {
          totalSize += chunk.length;
        })
        .on("end", () => {
          resolve({
            size: totalSize,
          });
        });

      this.client.putObject(this.minioConfiguration.bucket, path, stream);
    });
  }

  async read(path: string): Promise<Readable> {
    // Test if file exists in S3 bucket 10 times until we find it
    const tries = 10;
    let err = null;
    for (let i = 0; i <= tries; i++) {
      try {
        const stat = await this.client.statObject(this.minioConfiguration.bucket, path);
        if (stat?.size > 0) {
          break;
        }
      } catch (e) {
        err = e;
      }

      if (i === tries) {
        logger.info(`Unable to get file after ${tries} tries:`);
        throw err;
      }

      await new Promise(r => setTimeout(r, 500));
      logger.info(`File ${path} not found in S3 bucket, retrying...`);
    }
    return this.client.getObject(this.minioConfiguration.bucket, path);
  }

  async remove(path: string): Promise<boolean> {
    try {
      await this.client.removeObject(this.minioConfiguration.bucket, path);
      return true;
    } catch (err) {}
    return false;
  }
}
