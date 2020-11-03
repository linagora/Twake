/* eslint-disable @typescript-eslint/no-explicit-any */
import cassandra from "cassandra-driver";
import { AbstractConnector } from "./abstract-connector";

export interface CassandraConnectionOptions {
  contactPoints: string[];
  localDataCenter: string;
  username: string;
  password: string;
  keyspace: string;
}

export class CassandraConnector extends AbstractConnector<
  CassandraConnectionOptions,
  cassandra.Client
> {
  private client: cassandra.Client;

  getClient(): cassandra.Client {
    return this.client;
  }

  async connect(): Promise<this> {
    if (this.client) {
      return this;
    }

    const cassandraOptions: cassandra.DseClientOptions = {
      contactPoints: this.options.contactPoints,
      localDataCenter: this.options.localDataCenter,
      keyspace: this.options.keyspace,
    };
    if (this.options.username && this.options.password) {
      cassandraOptions.authProvider = new cassandra.auth.PlainTextAuthProvider(
        this.options.username,
        this.options.password,
      );
    }

    this.client = new cassandra.Client(cassandraOptions);
    await this.client.connect();

    return this;
  }
}
