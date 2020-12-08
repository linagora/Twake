import { Initializable } from "../../../../../framework";
import { DatabaseType } from "../..";
import { CassandraConnectionOptions } from "./cassandra/cassandra";
import { MongoConnectionOptions } from "./mongodb/mongodb";
import { ColumnDefinition, EntityDefinition } from "../types";

export * from "./mongodb/mongodb";
export * from "./cassandra/cassandra";

export type UpsertOptions = {};

export type RemoveOptions = {};

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
