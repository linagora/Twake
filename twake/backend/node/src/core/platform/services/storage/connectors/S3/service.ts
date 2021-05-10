import { Readable } from "stream";
import { StorageConnectorAPI } from "../../provider";
import * as Minio from "minio";

export default class S3ConnectorService implements StorageConnectorAPI {
  client: Minio.Client;

  constructor(S3Configuration: Minio.ClientOptions) {
    this.client = new Minio.Client({ ...S3Configuration });
  }

  //TO-DO: changer les any
  write(path: any, stream: any): boolean {
    //TO-DO: récuperer bucket de config
    this.client.putObject("twake", path, stream);
    return true; //TO DO: retourner bien passé
  }

  async read(path: string): Promise<Readable> {
    return this.client.getObject("twake", path);
  }
}
