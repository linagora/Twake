import { Stream } from "stream";
import { TwakeServiceProvider } from "../../framework";

export interface StorageConnectorAPI {
  write(path: string, stream: Stream): boolean;
  read(path: string): Stream;
}

export default interface StorageAPI extends TwakeServiceProvider, StorageConnectorAPI {
  getConnector(): StorageConnectorAPI;
}
