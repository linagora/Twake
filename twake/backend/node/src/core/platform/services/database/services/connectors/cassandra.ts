/* eslint-disable @typescript-eslint/no-explicit-any */
import cassandra from "cassandra-driver";
import { defer, Subject, throwError, timer } from "rxjs";
import { concat, delayWhen, retryWhen, take, tap } from "rxjs/operators";
import { logger } from "../../../../../platform/framework";
import { Paginable, Pagination } from "../../../../../platform/framework/api/crud-service";
import { AbstractConnector } from "./abstract-connector";

export interface CassandraConnectionOptions {
  contactPoints: string[];
  localDataCenter: string;
  username: string;
  password: string;
  keyspace: string;

  /**
   * Wait for keyspace and tables to be created at init
   */
  wait: boolean;

  /**
   * When wait = true, retry to get the resources N times where N = retries
   */
  retries?: number;

  /**
   * Delay in ms between the retries. The delay is growing each time a retry fails like delay = retryCount * delay
   */
  delay?: number;
}

export class CassandraConnector extends AbstractConnector<
  CassandraConnectionOptions,
  cassandra.Client
> {
  private client: cassandra.Client;

  getClient(): cassandra.Client {
    return this.client;
  }

  async init(): Promise<this> {
    if (!this.client) {
      await this.connect();
    }

    try {
      await this.createKeyspace();
    } catch (err) {
      logger.warn("Keyspace can not be created", err);
    }

    if (this.options.wait) {
      await this.waitForKeyspace(this.options.delay, this.options.retries);
    }

    return this;
  }

  createKeyspace(): Promise<cassandra.types.ResultSet> {
    return this.client.execute(
      `CREATE KEYSPACE IF NOT EXISTS ${this.options.keyspace} WITH replication = {'class': 'NetworkTopologyStrategy', 'datacenter1': '2'} AND durable_writes = true;`,
    );
  }

  async isKeyspaceCreated(): Promise<boolean> {
    let result;

    try {
      result = await this.client.execute(
        `SELECT * FROM system_schema.keyspaces where keyspace_name = '${this.options.keyspace}'`,
      );

      if (!result) {
        throw new Error("No result for keyspace query");
      }
    } catch (err) {
      throw new Error("Keyspace query error");
    }

    return result ? Promise.resolve(true) : Promise.reject(new Error("Keyspace not found"));
  }

  waitForKeyspace(delay: number = 500, retries: number = 10): Promise<boolean> {
    const subject = new Subject<boolean>();
    const obs$ = defer(() => this.isKeyspaceCreated());

    obs$
      .pipe(
        retryWhen(errors =>
          errors.pipe(
            delayWhen((_, i) => timer(i * delay)),
            //delay(1000), if we want fixed delay
            tap(() => logger.debug("Retrying...")),
            take(retries),
            concat(throwError("Maximum number of retries reached")),
          ),
        ),
      )
      .subscribe(
        () => logger.debug("Keyspace has been found"),
        err => {
          logger.error({ err }, "Error while getting keyspace information");
          subject.error(new Error("Can not find keyspace information"));
        },
        () => subject.complete(),
      );

    return subject.toPromise();
  }

  async drop(): Promise<this> {
    try {
      await this.client.execute(`DROP KEYSPACE IF EXISTS ${this.options.keyspace};`);
    } catch (err) {
      logger.error({ err }, "Error while dropping keyspace");
    }

    return this;
  }

  async connect(): Promise<this> {
    if (this.client) {
      return this;
    }

    const cassandraOptions: cassandra.DseClientOptions = {
      contactPoints: this.options.contactPoints,
      localDataCenter: this.options.localDataCenter,
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

  private constructor(readonly page_token: string, readonly limitStr = "100") {
    super(page_token, limitStr);
    this.limit = Number.parseInt(limitStr, 10);
  }

  static from(pagination: Paginable): CassandraPagination {
    return new CassandraPagination(pagination.page_token, pagination.limitStr);
  }

  static next(current: Pagination, pageState: string): Paginable {
    return new Pagination(pageState, current.limitStr);
  }
}

export function waitForTable(
  client: cassandra.Client,
  keyspace: string,
  table: string,
  retries: number = 10,
  delay: number = 500,
): Promise<boolean> {
  const subject = new Subject<boolean>();
  const obs$ = defer(() => checkForTable(client, keyspace, table));

  obs$
    .pipe(
      retryWhen(errors =>
        errors.pipe(
          delayWhen((_, i) => timer(i * delay)),
          //delay(1000),
          tap(() => logger.debug("Retrying to get table metadata...")),
          take(retries),
          concat(throwError("Maximum number of retries reached")),
        ),
      ),
    )
    .subscribe(
      () => logger.debug(`Table ${table} has been found`),
      err => {
        logger.debug(`Table ${table} error: ${err.message}`);
        subject.error(new Error("Can not find table"));
      },
      () => subject.complete(),
    );

  return subject.toPromise();
}

async function checkForTable(
  client: cassandra.Client,
  keyspace: string,
  table: string,
): Promise<void> {
  try {
    const result: cassandra.types.ResultSet = await client.execute(
      `SELECT * FROM system_schema.tables WHERE keyspace_name='${keyspace}' AND table_name='${table}'`,
    );

    const tableMetadata = result.rows[0];

    logger.debug("Table metadata %o", tableMetadata);

    if (!tableMetadata) {
      throw new Error("Can not find table metadata");
    }
  } catch (err) {
    logger.error({ err }, "Error while getting table metadata");
    throw new Error("Error while getting table metadata");
  }
}
