import { Initializable } from "../../../../framework";
import { SearchType } from "..";
import { ElasticSearchConnectionOptions } from "./elasticsearch/elasticsearch";
import { MongoConnectionOptions } from "./mongodb/mongodb";

export * from "./mongodb/mongodb";
export * from "./elasticsearch/elasticsearch";

export type UpsertOptions = any;

export type RemoveOptions = any;

export interface Connector extends Initializable {
  /**
   * Connect to the search
   */
  connect(): Promise<this>;

  /**
   * Get the type of connector
   */
  getType(): SearchType;
}

export declare type ConnectionOptions = MongoConnectionOptions | ElasticSearchConnectionOptions;
