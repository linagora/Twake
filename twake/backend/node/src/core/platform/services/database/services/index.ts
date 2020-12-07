import { DatabaseServiceAPI } from "../api";
import { ConnectorFactory } from "./connector-factory";
import { Connector } from "./connectors";
import Manager from "./orm/manager";
import Repository, { RepositoryOptions } from "./orm/repository";
import { CassandraConnectionOptions } from "./connectors/cassandra";
import { MongoConnectionOptions } from "./connectors/mongodb";

export default class DatabaseService implements DatabaseServiceAPI {
  version = "1";
  private connector: Connector;
  private manager: Manager;
  private repository: Repository<any>;

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
    if (this.repository) {
      return this.repository;
    }

    this.repository = new Repository<Table>(this.connector, table, options);

    return this.repository;
  }
}

export declare type ConnectionOptions = MongoConnectionOptions | CassandraConnectionOptions;

export declare type DatabaseType = "mongodb" | "cassandra";
