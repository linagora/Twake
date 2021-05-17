import { Readable } from "stream";
import { StorageConnectorAPI } from "../../provider";
import * as Minio from "minio";

export type S3Configuration = Minio.ClientOptions & { bucket: string };

export default class S3ConnectorService implements StorageConnectorAPI {
  client: Minio.Client;
  minioConfiguration: S3Configuration;

  constructor(S3Configuration: S3Configuration) {
    this.client = new Minio.Client({ ...S3Configuration });
    this.minioConfiguration = S3Configuration;
  }

  write(path: string, stream: Readable) {
    this.client.putObject(this.minioConfiguration.bucket, path, stream);
  }

  async read(path: string): Promise<Readable> {
    return this.client.getObject(this.minioConfiguration.bucket, path);
  }
}
