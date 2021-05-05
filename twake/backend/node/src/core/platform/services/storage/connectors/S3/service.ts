import { Stream, Readable } from "stream";
import { StorageConnectorAPI } from "../../provider";
import * as Minio from "minio";
import { randomBytes, createCipheriv } from "crypto";

export default class S3ConnectorService implements StorageConnectorAPI {
  client: Minio.Client;

  constructor(S3Configuration: Minio.ClientOptions) {
    this.client = new Minio.Client({ ...S3Configuration });
  }

  write(path: any, stream: any): boolean {
    stream.data.file;
    const folder_Name = stream.data.filename;
    const company_id = stream.company_id;
    const user_id = "user_id";
    const chunk_number = path["resumableChunkNumber"];
    //const iv = randomBytes(64);
    //const secret_key = randomBytes(32);
    //var encrypt = createCipheriv("aes-256-gcm", secret_key, iv);

    //encrypt.on("data", chunk => {});
    stream.data.filename = "chunk" + chunk_number;
    this.client.putObject(
      "twake",
      `/twake/files/${company_id}/${user_id}/${folder_Name}/${stream.data.filename}`,
      stream.data.file,
    );
    return false;
  }

  async read(path: string): Promise<Readable> {
    return this.client.getObject("twake", path);
  }
}
