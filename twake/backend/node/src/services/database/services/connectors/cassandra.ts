/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbstractConnector } from "./abstract-connector";

export interface CassandraConnectionOptions {
  url: string;
}

export class CassandraConnector extends AbstractConnector<CassandraConnectionOptions, any> {

  getClient(): any {
    throw new Error("Method not implemented.");
  }

  async connect(): Promise<this> {
    throw new Error("Not implemented");
  }
}