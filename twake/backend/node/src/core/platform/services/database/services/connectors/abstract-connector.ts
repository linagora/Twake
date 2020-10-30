import { Connector } from ".";
import { ConnectionOptions, DatabaseType } from "..";

export abstract class AbstractConnector<T extends ConnectionOptions, DatabaseClient>
  implements Connector {
  constructor(protected type: DatabaseType, protected options: T) {}

  abstract connect(): Promise<this>;

  abstract getClient(): DatabaseClient;

  getType(): DatabaseType {
    return this.type;
  }
}
