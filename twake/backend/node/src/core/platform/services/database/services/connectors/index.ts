import { Initializable } from "../../../../../../core/platform/framework";
import { DatabaseType } from "..";
import { CassandraConnectionOptions } from "./cassandra";
import { MongoConnectionOptions } from "./mongodb";
import { ColumnDefinition, EntityDefinition } from "../orm/types";

export * from "./mongodb";
export * from "./cassandra";

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

  /**
   * Create table
   */
  createTable(
    entity: EntityDefinition,
    columns: { [name: string]: ColumnDefinition },
  ): Promise<boolean>;

  /**
   * Upsert
   * returns true if the object was created/updated, false otherwise
   */
  upsert(entities: any[]): Promise<boolean[]>;

  /**
   * Remove
   * returns true if the object was removed, false otherwise
   */
  remove(entities: any[]): Promise<boolean[]>;
}

export declare type ConnectionOptions = MongoConnectionOptions | CassandraConnectionOptions;
