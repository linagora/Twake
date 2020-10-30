import { DatabaseServiceAPI } from "../api";
import { ConnectorFactory } from "./connector-factory";
import { Connector } from "./connectors";
import { CassandraConnectionOptions } from "./connectors/cassandra";
import { MongoConnectionOptions } from "./connectors/mongodb";

export default class DatabaseService implements DatabaseServiceAPI {
  version = "1";
  private connector: Connector;

  constructor(readonly type: DatabaseType, private options: ConnectionOptions) {}

  getConnector(): Connector {
    if (this.connector) {
      return this.connector;
    }

    this.connector = new ConnectorFactory().create(this.type, this.options);

    return this.connector;
  }
}

export declare type ConnectionOptions = MongoConnectionOptions | CassandraConnectionOptions;

export declare type DatabaseType = "mongodb" | "cassandra";
