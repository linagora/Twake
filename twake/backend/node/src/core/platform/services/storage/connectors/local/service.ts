import { Readable } from "stream";
import { StorageConnectorAPI } from "../../provider";
import fs from "fs";

export type LocalConfiguration = { path: string };

export default class LocalConnectorService implements StorageConnectorAPI {
  configuration: LocalConfiguration;

  constructor(localConfiguration: LocalConfiguration) {
    this.configuration = localConfiguration;
  }

  write(path: string, stream: Readable) {
    const fullPath = this.getFullPath(path);
    const writeStream = fs.createWriteStream(fullPath);
    writeStream.write(stream);
  }

  async read(path: string): Promise<Readable> {
    const fullPath = this.getFullPath(path);
    return fs.createReadStream(fullPath);
  }

  getFullPath(path: string) {
    return `${this.configuration.path}/${path}`.replace(/\/{2,}/g, "/");
  }
}
