/* eslint-disable @typescript-eslint/no-explicit-any */
import cassandra from "cassandra-driver";
import { Paginable, Pagination } from "../../../../../platform/framework/api/crud-service";
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

export class CassandraPagination extends Pagination {
  limit = 100;

  private constructor(readonly page_token: string, readonly max_results = "100") {
    super(page_token, max_results);
    this.limit = Number.parseInt(max_results, 10);
  }

  static from(pagination: Paginable): CassandraPagination {
    return new CassandraPagination(pagination.page_token, pagination.max_results);
  }

  static next(current: Pagination, pageState: string): Paginable {
    return new Pagination(pageState, current.max_results);
  }
}
