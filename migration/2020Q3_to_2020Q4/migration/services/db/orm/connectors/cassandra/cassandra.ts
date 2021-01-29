/* eslint-disable @typescript-eslint/no-explicit-any */
import cassandra from "cassandra-driver";
import { defer, Subject, throwError, timer } from "rxjs";
import { concat, delayWhen, retryWhen, take, tap } from "rxjs/operators";
import { UpsertOptions } from "..";
import { getEntityDefinition, unwrapPrimarykey } from "../../utils";
import { EntityDefinition, ColumnDefinition, ObjectType } from "../../types";
import { AbstractConnector } from "../abstract-connector";
import {
  transformValueToDbString,
  cassandraType,
  transformValueFromDbString,
} from "./typeTransforms";
import { FindOptions } from "../../repository/repository";
import { ListResult, Pagination } from "../../../crud-service";
import { Paginable } from "../../../crud-service";
import { buildSelectQuery } from "./query-builder";

export { CassandraPagination } from "./pagination";

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
      console.log("Keyspace can not be created", err);
    }

    if (this.options.wait) {
      await this.waitForKeyspace(this.options.delay, this.options.retries);
    }

    return this;
  }

  createKeyspace(): Promise<cassandra.types.ResultSet> {
    return this.client.execute(
      `CREATE KEYSPACE IF NOT EXISTS ${this.options.keyspace} WITH replication = {'class': 'NetworkTopologyStrategy', 'datacenter1': '2'} AND durable_writes = true;`
    );
  }

  async isKeyspaceCreated(): Promise<boolean> {
    let result;

    try {
      result = await this.client.execute(
        `SELECT * FROM system_schema.keyspaces where keyspace_name = '${this.options.keyspace}'`
      );

      if (!result) {
        throw new Error("No result for keyspace query");
      }
    } catch (err) {
      throw new Error("Keyspace query error");
    }

    return result
      ? Promise.resolve(true)
      : Promise.reject(new Error("Keyspace not found"));
  }

  waitForKeyspace(delay: number = 500, retries: number = 10): Promise<boolean> {
    const subject = new Subject<boolean>();
    const obs$ = defer(() => this.isKeyspaceCreated());

    obs$
      .pipe(
        retryWhen((errors) =>
          errors.pipe(
            delayWhen((_, i) => timer(i * delay)),
            //delay(1000), if we want fixed delay
            tap(() => console.log("Retrying...")),
            take(retries),
            concat(throwError("Maximum number of retries reached"))
          )
        )
      )
      .subscribe(
        () => console.log("Keyspace has been found"),
        (err) => {
          console.log({ err }, "Error while getting keyspace information");
          subject.error(new Error("Can not find keyspace information"));
        },
        () => subject.complete()
      );

    return subject.toPromise();
  }

  async drop(): Promise<this> {
    try {
      await this.client.execute(
        `DROP KEYSPACE IF EXISTS ${this.options.keyspace};`
      );
    } catch (err) {
      console.log({ err }, "Error while dropping keyspace");
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
        this.options.password
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
      result = dbResult.rows.map((row) => row.values()[0]);
    } catch (err) {
      throw "Table query error";
    }

    return result ? Promise.resolve(result || []) : Promise.resolve([]);
  }

  async createTable(
    entity: EntityDefinition,
    columns: { [name: string]: ColumnDefinition }
  ): Promise<boolean> {
    let result = true;

    // --- Generate column and key definition --- //
    const primaryKey = entity.options.primaryKey || [];

    if (primaryKey.length === 0) {
      console.log("Primary key was not defined for table " + entity.name);
      return false;
    }

    const partitionKeyPart = primaryKey.shift();
    const partitionKey: string[] =
      typeof partitionKeyPart === "string"
        ? [partitionKeyPart]
        : partitionKeyPart;
    const clusteringKeys: string[] = primaryKey as string[];
    if (
      [...partitionKey, ...clusteringKeys].some(
        (key) => columns[key] === undefined
      )
    ) {
      console.log(
        "One primary key item doesn't exists in entity columns for table " +
          entity.name
      );
      return false;
    }

    const clusteringOrderBy = clusteringKeys.map((key) => {
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
      .map((colName) => {
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
      const alterQueryColumns = Object.keys(columns)
        .filter((colName) => existingColumns.indexOf(colName) < 0)
        .map((colName) => `${colName} ${cassandraType[columns[colName].type]}`);
      query = `ALTER TABLE ${this.options.keyspace}.${
        entity.name
      } ADD (${alterQueryColumns.join(", ")})`;

      if (alterQueryColumns.length === 0) {
        return true;
      }
    }

    // --- Write table --- //
    try {
      await this.client.execute(query);
    } catch (err) {
      console.log(
        { err },
        `service.database.orm.createTable - creation error for table ${entity.name} : ${err.message}`
      );
      result = false;
    }

    return result;
  }

  async upsert(
    entities: any[],
    options: UpsertOptions = {}
  ): Promise<boolean[]> {
    return new Promise((resolve) => {
      const promises: Promise<boolean>[] = [];

      entities.forEach((entity) => {
        const { columnsDefinition, entityDefinition } = getEntityDefinition(
          entity
        );
        const primaryKey = unwrapPrimarykey(entityDefinition);

        //Set updated content
        const set = Object.keys(columnsDefinition)
          .filter((key) => primaryKey.indexOf(key) === -1)
          .filter(
            (key) => entity[columnsDefinition[key].nodename] !== undefined
          )
          .map((key) => [
            `${key}`,
            `${transformValueToDbString(
              entity[columnsDefinition[key].nodename],
              columnsDefinition[key].type,
              columnsDefinition[key].options
            )}`,
          ]);
        //Set primary key
        const where = primaryKey.map((key) => [
          `${key}`,
          `${transformValueToDbString(
            entity[columnsDefinition[key].nodename],
            columnsDefinition[key].type,
            columnsDefinition[key].options
          )}`,
        ]);

        // Add time-to-live options
        let ttlOptions = "";
        if (entityDefinition.options.ttl && entityDefinition.options.ttl > 0) {
          ttlOptions = `USING TTL ${entityDefinition.options.ttl}`;
        }

        // Insert and update are equivalent for most of Cassandra
        // Update is prefered because the only solution for counters
        let query = `UPDATE ${this.options.keyspace}.${
          entityDefinition.name
        } ${ttlOptions} SET ${set
          .map((e) => `${e[0]} = ${e[1]}`)
          .join(", ")} WHERE ${where
          .map((e) => `${e[0]} = ${e[1]}`)
          .join(" AND ")}`;

        // If no "set" part, we cannot do an update, so insert
        if (set.length === 0) {
          query = `INSERT INTO ${this.options.keyspace}.${
            entityDefinition.name
          } ${ttlOptions} (${where
            .map((e) => e[0])
            .join(", ")}) VALUES (${where.map((e) => e[1]).join(", ")})`;
        }

        promises.push(
          new Promise(async (resolve) => {
            try {
              await this.getClient().execute(query);
              resolve(true);
            } catch (err) {
              console.log("Error with CQL query: ", query, err);
              resolve(false);
            }
          })
        );
      });

      Promise.all(promises).then(resolve);
    });
  }

  async remove(entities: any[]): Promise<boolean[]> {
    return new Promise((resolve) => {
      const promises: Promise<boolean>[] = [];

      entities.forEach((entity) => {
        const { columnsDefinition, entityDefinition } = getEntityDefinition(
          entity
        );
        const primaryKey = unwrapPrimarykey(entityDefinition);

        //Set primary key
        const where = primaryKey.map(
          (key) =>
            `${key} = ${transformValueToDbString(
              entity[columnsDefinition[key].nodename],
              columnsDefinition[key].type,
              columnsDefinition[key].options
            )}`
        );

        const query = `DELETE FROM ${this.options.keyspace}.${
          entityDefinition.name
        } WHERE ${where.join(" AND ")}`;
        promises.push(
          new Promise(async (resolve) => {
            try {
              await this.getClient().execute(query);
              resolve(true);
            } catch (err) {
              console.log("Error with CQL query: ", query, err);
              resolve(false);
            }
          })
        );
      });

      Promise.all(promises).then(resolve);
    });
  }

  async find<Table>(
    entityType: Table,
    filters: any,
    options: FindOptions = {}
  ): Promise<ListResult<Table>> {
    const instance = new (entityType as any)();
    const { columnsDefinition, entityDefinition } = getEntityDefinition(
      instance
    );

    const pk = unwrapPrimarykey(entityDefinition);
    if (Object.keys(filters).some((key) => pk.indexOf(key) < 0)) {
      //Filter not in primary key
      throw Error(
        "All filter parameters must be defined in entity primary key, got: " +
          JSON.stringify(Object.keys(filters)) +
          " on table " +
          entityDefinition.name +
          " but pk is " +
          JSON.stringify(pk)
      );
    }

    const query = buildSelectQuery<Table>(
      (entityType as unknown) as ObjectType<Table>,
      filters,
      options,
      {
        keyspace: this.options.keyspace,
      }
    );

    let results = null;
    try {
      results = await this.getClient().execute(query, [], {
        fetchSize: parseInt(options.pagination.limitStr),
        pageState: options.pagination.page_token || undefined,
        prepare: true,
      });
    } catch (err) {
      console.log(query);
    }

    const entities: Table[] = [];
    results.rows.forEach((row) => {
      const entity = new (entityType as any)();
      Object.keys(row).forEach((key) => {
        entity[columnsDefinition[key].nodename] = transformValueFromDbString(
          row[key],
          columnsDefinition[key].type,
          columnsDefinition[key].options
        );
      });
      entities.push(entity);
    });

    const nextPage: Paginable = new Pagination(
      results.pageState,
      options.pagination.limitStr || "100"
    );
    return new ListResult<Table>(entityDefinition.type, entities, nextPage);
  }
}

export function waitForTable(
  client: cassandra.Client,
  keyspace: string,
  table: string,
  retries: number = 10,
  delay: number = 500
): Promise<boolean> {
  const subject = new Subject<boolean>();
  const obs$ = defer(() => checkForTable(client, keyspace, table));

  obs$
    .pipe(
      retryWhen((errors) =>
        errors.pipe(
          delayWhen((_, i) => timer(i * delay)),
          //delay(1000),
          tap(() => console.log("Retrying to get table metadata...")),
          take(retries),
          concat(throwError("Maximum number of retries reached"))
        )
      )
    )
    .subscribe(
      () => console.log(`Table ${table} has been found`),
      (err) => {
        console.log(`Table ${table} error: ${err.message}`);
        subject.error(new Error("Can not find table"));
      },
      () => subject.complete()
    );

  return subject.toPromise();
}

async function checkForTable(
  client: cassandra.Client,
  keyspace: string,
  table: string
): Promise<void> {
  try {
    const result: cassandra.types.ResultSet = await client.execute(
      `SELECT * FROM system_schema.tables WHERE keyspace_name='${keyspace}' AND table_name='${table}'`
    );

    const tableMetadata = result.rows[0];

    console.log("Table metadata %o", tableMetadata);

    if (!tableMetadata) {
      throw new Error("Can not find table metadata");
    }
  } catch (err) {
    console.log({ err }, "Error while getting table metadata");
    throw new Error("Error while getting table metadata");
  }
}
