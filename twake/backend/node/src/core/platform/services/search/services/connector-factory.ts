import { SearchType } from ".";
import { ConnectionOptions, Connector } from "./connectors";
import {
  ElasticSearchConnectionOptions,
  ElasticSearchConnector,
} from "./connectors/elasticsearch/elasticsearch";
import { MongoConnectionOptions, MongoConnector } from "./connectors/mongodb/mongodb";

export class ConnectorFactory {
  public create(type: SearchType, options: ConnectionOptions): Connector {
    switch (type) {
      case "elasticsearch":
        return new ElasticSearchConnector(type, options as ElasticSearchConnectionOptions);
      case "mongodb":
        return new MongoConnector(type, options as MongoConnectionOptions);
      default:
        throw new Error(`${type} is not supported`);
    }
  }
}
