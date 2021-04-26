import { Stream } from "stream";
import { StorageConnectorAPI } from "../../provider";
import * as Minio from "minio";

export default class S3ConnectorService implements StorageConnectorAPI {
  client: Minio.Client;

  constructor(S3Configuration: any) {
    this.client = new Minio.Client({ ...S3Configuration });
  }

  write(path: any, stream: any): boolean {
    stream.data.file;
    const folder_Name = stream.data.filename;
    ///twake/files/{company_id}/{user_id}/{file_identifier}/chunk.1
    const company_id = "company_id";
    const user_id = "user_id";
    //const file_identifier = path["resumableFileIdentifier"];
    const chunk_number = path["resumableChunkNumber"];

    stream.data.filename = "chunk" + chunk_number;
    this.client.putObject(
      "audio",
      `/twake/files/${company_id}/${user_id}/${folder_Name}/` + stream.data.filename,
      stream.data.file,
    );
    //return `https://play.minio.io:9000/audio/${stream.filename}`;
    return false;
  }

  read(path: string): Stream {
    return null;
  }
}
