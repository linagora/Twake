import { DatabaseType } from ".";
import { ConnectionOptions, Connector } from "./connectors";
import { CassandraConnectionOptions, CassandraConnector } from "./connectors/cassandra";
import { MongoConnectionOptions, MongoConnector } from "./connectors/mongodb";

export class ConnectorFactory {
  public create(type: DatabaseType, options: ConnectionOptions): Connector {
    switch (type) {
      case "cassandra":
        return new CassandraConnector(type, options as CassandraConnectionOptions);
      case "mongodb":
        return new MongoConnector(type, options as MongoConnectionOptions);
      default:
        throw new Error(`${type} is not supported`);
    }
  }
}
