import { Readable } from "stream";
import { createWriteStream, createReadStream, existsSync, mkdirSync, statSync } from "fs";
import { StorageConnectorAPI, WriteMetadata } from "../../provider";
import p from "path";

export type LocalConfiguration = {
  path: string;
};

export default class LocalConnectorService implements StorageConnectorAPI {
  configuration: LocalConfiguration;

  constructor(localConfiguration: LocalConfiguration) {
    this.configuration = localConfiguration;
  }

  write(relativePath: string, stream: Readable): Promise<WriteMetadata> {
    const path = this.getFullPath(relativePath);

    const directory = p.dirname(path);
    if (!existsSync(directory)) {
      mkdirSync(directory, {
        recursive: true,
      });
    }

    return new Promise((resolve, reject) => {
      const file = createWriteStream(path);
      file
        .on("error", function (err) {
          reject(err);
        })
        .on("finish", () => {
          const stats = statSync(path);
          resolve({
            size: stats.size,
          });
        });
      stream.pipe(file);
    });
  }

  async read(path: string): Promise<Readable> {
    return createReadStream(this.getFullPath(path));
  }

  private getFullPath(path: string): string {
    return `${this.configuration.path}/${path}`.replace(/\/{2,}/g, "/");
  }
}
