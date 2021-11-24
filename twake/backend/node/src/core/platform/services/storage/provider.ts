import { Stream, Readable } from "stream";
import { TwakeServiceProvider } from "../../framework";

export type WriteMetadata = {
  size: number;
};

export type WriteOptions = {
  chunkNumber?: number;
  encryptionKey?: string;
  encryptionAlgo?: string;
};

export type ReadOptions = {
  totalChunks?: number;
  encryptionKey?: string;
  encryptionAlgo?: string;
};

export interface StorageConnectorAPI {
  /**
   * Write a stream to a path
   *
   * @param path
   * @param stream
   */
  write(path: string, stream: Stream, options?: WriteOptions): Promise<WriteMetadata>;

  /**
   * Read a path and returns its stream
   *
   * @param path
   */
  read(path: string, options?: ReadOptions): Promise<Readable>;

  /**
   * Remove a path
   *
   * @param path
   */
  remove(path: string): Promise<boolean>;
}

export default interface StorageAPI extends TwakeServiceProvider, StorageConnectorAPI {
  getConnector(): StorageConnectorAPI;
  getConnectorType(): string;
}
