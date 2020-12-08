import { DatabaseServiceAPI } from "../api";
import { ConnectorFactory } from "./connector-factory";
import { Connector } from "./orm/connectors";
import Manager from "./orm/manager";
import Repository, { RepositoryOptions } from "./orm/repository";
import { CassandraConnectionOptions } from "./orm/connectors/cassandra/cassandra";
import { MongoConnectionOptions } from "./orm/connectors/mongodb/mongodb";

export default class DatabaseService implements DatabaseServiceAPI {
  version = "1";
  private connector: Connector;
  private manager: Manager;
  private repositories: { [table: string]: Repository<any> } = {};

  constructor(readonly type: DatabaseType, private options: ConnectionOptions) {}

  getConnector(): Connector {
    if (this.connector) {
      return this.connector;
    }

    this.connector = new ConnectorFactory().create(this.type, this.options);

    return this.connector;
  }

  newManager(): Manager {
    return new Manager(this.connector);
  }

  getRepository<Table>(table: string, options?: RepositoryOptions): Repository<Table> {
    if (this.repositories[table]) {
      return this.repositories[table];
    }

    this.repositories[table] = new Repository<Table>(this.connector, table, options);

    return this.repositories[table];
  }
}

export declare type ConnectionOptions = MongoConnectionOptions | CassandraConnectionOptions;

export declare type DatabaseType = "mongodb" | "cassandra";
