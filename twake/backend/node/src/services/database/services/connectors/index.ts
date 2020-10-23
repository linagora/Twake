import { DatabaseType } from "..";
import { CassandraConnectionOptions } from "./cassandra";
import { MongoConnectionOptions } from "./mongodb";

export interface Connector {
  /**
   * Connect to the database
   */
  connect(): Promise<this>;

  /**
   * Get the type of connector
   */
  getType(): DatabaseType;
}

export declare type ConnectionOptions = MongoConnectionOptions | CassandraConnectionOptions;
