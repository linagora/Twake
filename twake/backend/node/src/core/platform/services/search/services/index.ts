import { SearchServiceAPI } from "../api";
import { ConnectorFactory } from "./connector-factory";
import { Connector } from "./connectors";
import { ElasticSearchConnectionOptions } from "./connectors/elasticsearch/elasticsearch";
import { MongoConnectionOptions } from "./connectors/mongodb/mongodb";

export default class SearchService implements SearchServiceAPI {
  version = "1";
  private connector: Connector;

  constructor(readonly type: SearchType, private options: ConnectionOptions) {}

  getConnector(): Connector {
    if (this.connector) {
      return this.connector;
    }

    this.connector = new ConnectorFactory().create(this.type, this.options);

    return this.connector;
  }
}

export declare type ConnectionOptions = MongoConnectionOptions | ElasticSearchConnectionOptions;

export declare type SearchType = "mongodb" | "elasticsearch";
