import * as mongo from "mongodb";
import { AbstractConnector } from "./abstract-connector";

export interface MongoConnectionOptions {
  // TODO: More options
  uri: string;

  database: string;
}

export class MongoConnector extends AbstractConnector<MongoConnectionOptions, mongo.MongoClient> {
  private client: mongo.MongoClient;

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
}
