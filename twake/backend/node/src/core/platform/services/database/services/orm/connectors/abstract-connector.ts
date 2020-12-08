import { Connector } from ".";
import { ConnectionOptions, DatabaseType } from "../..";
import { ColumnDefinition, EntityDefinition } from "../types";

export abstract class AbstractConnector<T extends ConnectionOptions, DatabaseClient>
  implements Connector {
  constructor(protected type: DatabaseType, protected options: T) {}

  abstract connect(): Promise<this>;

  abstract drop(): Promise<this>;

  abstract getClient(): DatabaseClient;

  abstract async createTable(
    entity: EntityDefinition,
    columns: { [name: string]: ColumnDefinition },
  ): Promise<boolean>;

  abstract upsert(entities: any[]): Promise<boolean[]>;

  abstract remove(entities: any[]): Promise<boolean[]>;

  getOptions(): T {
    return this.options;
  }

  getType(): DatabaseType {
    return this.type;
  }
}
