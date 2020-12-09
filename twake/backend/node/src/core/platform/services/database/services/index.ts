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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private repositories: Map<string, Repository<any>>;

  constructor(readonly type: DatabaseType, private options: ConnectionOptions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.repositories = new Map<string, Repository<any>>();
  }

  getConnector(): Connector {
    if (this.connector) {
      return this.connector;
    }

    this.connector = new ConnectorFactory().create(this.type, this.options);

    return this.connector;
  }

  newManager<T>(): Manager<T> {
    return new Manager<T>(this.connector);
  }

  getRepository<Table>(table: string, options?: RepositoryOptions): Repository<Table> {
    if (!this.repositories.has(table)) {
      this.repositories.set(table, new Repository<Table>(this.connector, table, options));
    }

    return this.repositories.get(table);
  }
}

export declare type ConnectionOptions = MongoConnectionOptions | CassandraConnectionOptions;

export declare type DatabaseType = "mongodb" | "cassandra";
