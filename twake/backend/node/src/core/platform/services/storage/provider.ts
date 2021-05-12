import { Stream, Readable } from "stream";
import { TwakeServiceProvider } from "../../framework";

export interface StorageConnectorAPI {
  write(path: string, stream: Stream): void;
  read(path: string): Promise<Readable>;
}

export default interface StorageAPI extends TwakeServiceProvider, StorageConnectorAPI {
  getConnector(): StorageConnectorAPI;
}
