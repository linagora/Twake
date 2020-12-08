import * as mongo from "mongodb";
import { Paginable, Pagination } from "../../../../../../framework/api/crud-service";
import { ColumnDefinition, EntityDefinition } from "../../types";
import { AbstractConnector } from "../abstract-connector";

export { MongoPagination } from "./pagination";

export interface MongoConnectionOptions {
  // TODO: More options
  uri: string;

  database: string;
}

const mongoType = {
  string: "TEXT",
  encrypted: "TEXT",
  number: "BIGINT",
  timeuuid: "TIMEUUID",
  uuid: "UUID",
  counter: "COUNTER",
  blob: "BLOB",
  boolean: "BOOLEAN",
};

const transformValueToDbString = (v: any, type: string, options: any = {}) => {
  return `'${v || ""}'`;
};

const transformValueFromDbString = (v: any, type: string, options: any = {}) => {
  return v;
};

export class MongoConnector extends AbstractConnector<MongoConnectionOptions, mongo.MongoClient> {
  private client: mongo.MongoClient;

  async init(): Promise<this> {
    return this;
  }

  async connect(): Promise<this> {
    if (this.client && this.client.isConnected) {
      return this;
    }

    this.client = await mongo.connect(this.options.uri);

    return this;
  }

  getClient(): mongo.MongoClient {
    return this.client;
  }

  getDatabase(): mongo.Db {
    return this.client.db(this.options.database);
  }

  async drop(): Promise<this> {
    await this.getDatabase().dropDatabase();

    return this;
  }

  async createTable(
    _entity: EntityDefinition,
    _columns: { [name: string]: ColumnDefinition },
  ): Promise<boolean> {
    //No-op for mongo ;)
    return true;
  }

  upsert(entities: any[]): Promise<boolean[]> {
    throw new Error("Method not implemented.");
  }
  remove(entities: any[]): Promise<boolean[]> {
    throw new Error("Method not implemented.");
  }
}
