import * as mongo from "mongodb";
import { AbstractConnector } from "../abstract-connector";
import { logger } from "../../../../../framework";

export interface MongoConnectionOptions {
  // TODO: More options
  uri: string;
  search: string;
}

export class MongoConnector extends AbstractConnector<MongoConnectionOptions, mongo.MongoClient> {
  private client: mongo.MongoClient;

  async init(): Promise<this> {
    if (!this.client) {
      await this.connect();
    }
    return this;
  }

  async connect(): Promise<this> {
    if (this.client && this.client.isConnected()) {
      return this;
    }

    this.client = await mongo.connect(this.options.uri);

    return this;
  }

  getClient(): mongo.MongoClient {
    return this.client;
  }
}
