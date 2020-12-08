import * as mongo from "mongodb";
import { UpsertOptions } from "..";
import { Paginable, Pagination } from "../../../../../../framework/api/crud-service";
import { ColumnDefinition, EntityDefinition } from "../../types";
import { getEntityDefinition, unwrapPrimarykey } from "../../utils";
import { AbstractConnector } from "../abstract-connector";
import { transformValueToDbString } from "./typeTransforms";

export { MongoPagination } from "./pagination";

export interface MongoConnectionOptions {
  // TODO: More options
  uri: string;

  database: string;
}

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
    const db = this.getDatabase();
    const collection = db.collection(`${_entity.name}`);

    //Mongo only need to create an index if ttl defined for entity
    if (_entity.options.ttl && _entity.options.ttl > 0) {
      const primaryKey = unwrapPrimarykey(_entity);
      const filter: any = {};
      primaryKey.forEach(key => {
        filter[key] = 1;
      });
      collection.createIndex(filter, { expireAfterSeconds: _entity.options.ttl });
    }

    return true;
  }
  async upsert(entities: any[], options: UpsertOptions = {}): Promise<boolean[]> {
    return new Promise(resolve => {
      const promises: Promise<mongo.UpdateWriteOpResult>[] = [];

      const db = this.getDatabase();

      entities.forEach(entity => {
        const { columnsDefinition, entityDefinition } = getEntityDefinition(entity);
        const primaryKey = unwrapPrimarykey(entityDefinition);

        //Set updated content
        const set: any = {};
        Object.keys(columnsDefinition)
          .filter(key => primaryKey.indexOf(key) === -1)
          .filter(key => entity[key] !== undefined)
          .forEach(key => {
            set[key] = transformValueToDbString(
              entity[key],
              columnsDefinition[key].type,
              columnsDefinition[key].options,
            );
          });

        //Set primary key
        const where: any = {};
        primaryKey.forEach(key => {
          where[key] = transformValueToDbString(
            entity[key],
            columnsDefinition[key].type,
            columnsDefinition[key].options,
          );
        });

        const collection = db.collection(`${entityDefinition.name}`);
        promises.push(collection.updateOne(where, set, { upsert: true }));
      });

      Promise.all(promises).then(results => {
        resolve(results.map(result => result.result.ok === 1));
      });
    });
  }

  async remove(entities: any[]): Promise<boolean[]> {
    return new Promise(resolve => {
      const promises: Promise<mongo.DeleteWriteOpResultObject>[] = [];

      const db = this.getDatabase();

      entities.forEach(entity => {
        const { columnsDefinition, entityDefinition } = getEntityDefinition(entity);
        const primaryKey = unwrapPrimarykey(entityDefinition);

        //Set primary key
        const where: any = {};
        primaryKey.forEach(key => {
          where[key] = transformValueToDbString(
            entity[key],
            columnsDefinition[key].type,
            columnsDefinition[key].options,
          );
        });

        const collection = db.collection(`${entityDefinition.name}`);
        promises.push(collection.deleteOne(where));
      });

      Promise.all(promises).then(results => {
        resolve(results.map(result => result.result.ok === 1));
      });
    });
  }
}
