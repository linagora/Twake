import { Readable } from "stream";
import { createWriteStream, createReadStream } from "fs";
import { StorageConnectorAPI } from "../../provider";

export type LocalConfiguration = {
  path: string;
};

export default class LocalConnectorService implements StorageConnectorAPI {
  configuration: LocalConfiguration;

  constructor(localConfiguration: LocalConfiguration) {
    this.configuration = localConfiguration;
  }

  write(path: string, stream: Readable): void {
    createWriteStream(this.getFullPath(path)).write(stream);
  }

  async read(path: string): Promise<Readable> {
    return createReadStream(this.getFullPath(path));
  }

  private getFullPath(path: string): string {
    return `${this.configuration.path}/${path}`.replace(/\/{2,}/g, "/");
  }
}
