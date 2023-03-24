import { Stream, Readable } from "stream";
import { TwakeServiceProvider } from "../../framework";
import { ExecutionContext } from "../../framework/api/crud-service";

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

export type DeleteOptions = {
  totalChunks?: number;
};

export interface StorageConnectorAPI {
  /**
   * Write a stream to a path
   *
   * @param path
   * @param stream
   */
  write(
    path: string,
    stream: Stream,
    options?: WriteOptions,
    context?: ExecutionContext,
  ): Promise<WriteMetadata>;

  /**
   * Read a path and returns its stream
   *
   * @param path
   */
  read(path: string, options?: ReadOptions, context?: ExecutionContext): Promise<Readable>;

  /**
   * Remove a path
   *
   * @param path
   */
  remove(path: string, options?: DeleteOptions, context?: ExecutionContext): Promise<boolean>;
}

export default interface StorageAPI extends TwakeServiceProvider, StorageConnectorAPI {
  getConnector(): StorageConnectorAPI;
  getConnectorType(): string;
}
