/* eslint-disable @typescript-eslint/no-explicit-any */
import cassandra from "cassandra-driver";
import { defer, Subject, throwError, timer } from "rxjs";
import { concat, delayWhen, retryWhen, take, tap } from "rxjs/operators";
import { DatabaseType } from "..";
import { logger } from "../../../../../platform/framework";
import { Paginable, Pagination } from "../../../../../platform/framework/api/crud-service";
import { EntityDefinition, ColumnDefinition } from "../orm/types";
import { AbstractConnector } from "./abstract-connector";

const cassandraType = {
  string: "TEXT",
  encrypted: "TEXT",
  number: "BIGINT",
  timeuuid: "TIMEUUID",
  uuid: "UUID",
  counter: "COUNTER",
  blob: "BLOB",
  boolean: "BOOLEAN",
};

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

    // Environment variable format is comma separated string
    const contactPoints =
      typeof this.options.contactPoints === "string"
        ? (this.options.contactPoints as string).split(",")
        : this.options.contactPoints;

    const cassandraOptions: cassandra.DseClientOptions = {
      contactPoints: contactPoints,
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

  async getTableDefinition(name: string): Promise<string[]> {
    let result: string[];

    try {
      const query = `SELECT column_name from system_schema.columns WHERE keyspace_name = '${this.options.keyspace}' AND table_name='${name}';`;
      const dbResult = await this.client.execute(query);
      result = dbResult.rows.map(row => row.values()[0]);
    } catch (err) {
      throw new Error("Table query error");
    }

    return result ? Promise.resolve(result || []) : Promise.resolve([]);
  }

  async createTable(
    entity: EntityDefinition,
    columns: { [name: string]: ColumnDefinition },
  ): Promise<boolean> {
    let result = true;

    // --- Generate column and key definition --- //
    const primaryKey = entity.options.primaryKey || [];

    if (primaryKey.length === 0) {
      logger.error("Primary key was not defined for tabe " + entity.name);
      return false;
    }

    let partitionKeyPart = primaryKey.shift();
    const partitionKey: string[] =
      typeof partitionKeyPart === "string" ? [partitionKeyPart] : partitionKeyPart;
    const clusteringKeys: string[] = primaryKey as string[];
    if ([...partitionKey, ...clusteringKeys].some(key => columns[key] === undefined)) {
      logger.error("One primary key item doesn't exists in entity columns for tabe " + entity.name);
      return false;
    }

    const clusteringOrderBy = clusteringKeys.map(key => {
      const direction: "ASC" | "DESC" = columns[key].options.order || "ASC";
      return `${key} ${direction}`;
    });
    const clusteringOrderByString =
      clusteringOrderBy.length > 0
        ? "WITH CLUSTERING ORDER BY (" + clusteringOrderBy.join(", ") + ")"
        : "";

    const allKeys = ["(" + partitionKey.join(", ") + ")", ...clusteringKeys];
    const primaryKeyString = `(${allKeys.join(", ")})`;

    const columnsString = Object.keys(columns)
      .map(colName => {
        const definition = columns[colName];
        return `${colName} ${cassandraType[definition.type]}`;
      })
      .join(",\n");

    // --- Generate final create table query --- //
    let query = `
        CREATE TABLE IF NOT EXISTS ${this.options.keyspace}.${entity.name}
          (
            ${columnsString},
            PRIMARY KEY ${primaryKeyString}
          ) ${clusteringOrderByString};`;

    // --- Alter table if not up to date --- //
    const existingColumns = await this.getTableDefinition(entity.name);
    if (existingColumns.length > 0) {
      console.log(`Existing columns for table ${entity.name}, generating altertable queries`);
      const alterQueryColumns = Object.keys(columns)
        .filter(colName => existingColumns.indexOf(colName) < 0)
        .map(colName => `${colName} ${cassandraType[columns[colName].type]}`);
      query = `ALTER TABLE ${this.options.keyspace}.${entity.name} ADD (${alterQueryColumns.join(
        ", ",
      )})`;

      if (alterQueryColumns.length === 0) {
        return true;
      }
    }

    // --- Write table --- //
    try {
      logger.debug(`service.channel.createTable - Creating table ${entity.name} : ${query}`);
      await this.client.execute(query);
    } catch (err) {
      logger.warn(
        { err },
        `service.channel.createTable creation error for table ${entity.name} : ${err.message}`,
      );
      console.log(err);
      result = false;
    }

    return result;
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
