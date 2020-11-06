import { Initializable } from "../../../../../../core/platform/framework";
import { DatabaseType } from "..";
import { CassandraConnectionOptions } from "./cassandra";
import { MongoConnectionOptions } from "./mongodb";

export interface Connector extends Initializable {
  /**
   * Connect to the database
   */
  connect(): Promise<this>;

  /**
   * Get the type of connector
   */
  getType(): DatabaseType;

  /**
   * Drop data
   */
  drop(): Promise<this>;
}

export declare type ConnectionOptions = MongoConnectionOptions | CassandraConnectionOptions;
