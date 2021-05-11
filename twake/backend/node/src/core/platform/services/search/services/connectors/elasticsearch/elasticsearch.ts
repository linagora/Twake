/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from "../../../../../framework";
import { AbstractConnector } from "../abstract-connector";
import { Client } from "@elastic/elasticsearch";

export interface ElasticSearchConnectionOptions {
  endpoints: string[];
}

export class ElasticSearchConnector extends AbstractConnector<
  ElasticSearchConnectionOptions,
  Client
> {
  private client: Client;

  getClient(): Client {
    return this.client;
  }

  async connect() {
    this.client = new Client({ node: this.getOptions().endpoints[0] });
    return this;
  }

  async init(): Promise<this> {
    if (!this.client) {
      await this.connect();
    }

    return this;
  }
}
