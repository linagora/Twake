import { Stream, Readable } from "stream";
import { TwakeServiceProvider } from "../../framework";

export type WriteMetadata = {
  size: number;
};

export interface StorageConnectorAPI {
  /**
   * Write a stream to a path
   *
   * @param path
   * @param stream
   */
  write(path: string, stream: Stream): Promise<WriteMetadata>;

  /**
   * Read a path and returns its stream
   *
   * @param path
   */
  read(path: string): Promise<Readable>;
}

export default interface StorageAPI extends TwakeServiceProvider, StorageConnectorAPI {
  getConnector(): StorageConnectorAPI;
}
