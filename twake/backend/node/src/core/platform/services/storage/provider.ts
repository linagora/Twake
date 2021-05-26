import { Stream, Readable } from "stream";
import { TwakeServiceProvider } from "../../framework";

export interface StorageConnectorAPI {
  /**
   * Write a stream to a path
   *
   * @param path
   * @param stream
   */
  write(path: string, stream: Stream): void;

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
