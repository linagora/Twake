import _ from "lodash";
import { Db } from "mongodb";
import { logger } from "../../../framework";
import { DatabaseServiceAPI } from "../../database/api";
import {
  getEntityDefinition,
  unwrapPrimarykey,
  DatabaseTableCreatedEvent,
  FindFilter,
  FindOptions,
  EntityTarget,
} from "../api";
import { SearchAdapter } from "../api";
import { ListResult, Pagination } from "../../../framework/api/crud-service";

import { MongoConnector } from "../../database/services/orm/connectors";

const searchPrefix = "search__";

const typeToIndex: { [key: string]: "text" } = {
  encoded_string: "text",
  string: "text",
};

type Operation = {
  index: string;
  id: string;
  action: "remove" | "upsert";
  body?: any;
};
export default class Search implements SearchAdapter {
  mongodb: Db;

  constructor(readonly database: DatabaseServiceAPI) {}

  public async connect() {
    const service = this.database.getConnector() as MongoConnector;
    this.mongodb = await service.getDatabase();
  }

  public async createIndex(event: DatabaseTableCreatedEvent) {
    const entityDefinition = event.definition.entity;
    const columns = event.definition.columns;

    if (!entityDefinition.options?.search) {
      return;
    }

    const index = entityDefinition.options?.search?.index || entityDefinition.name;
    const collection = this.mongodb.collection(`${searchPrefix}${index}`);

    const primaryKey = unwrapPrimarykey(entityDefinition);
    const indexedPk: any = {};
    primaryKey.forEach(key => {
      indexedPk[key] = 1;
    });

    const indexedFields: any = entityDefinition.options.search.mongoMapping || {};
    if (!entityDefinition.options.search.mongoMapping) {
      Object.keys(columns).forEach(c => {
        const def = columns[c];
        if (typeToIndex[def.type]) {
          indexedFields[c] = typeToIndex[def.type];
        }
      });
    }
    collection.createIndex({ id: 1, ...indexedPk, ...indexedFields });
  }

  public async upsert(entities: any[]) {
    entities.forEach(entity => {
      const { entityDefinition } = getEntityDefinition(entity);
      const pkColumns = unwrapPrimarykey(entityDefinition);

      if (!entityDefinition.options?.search) {
        return;
      }

      if (!entityDefinition.options?.search?.source) {
        logger.info(`Unable to do operation upsert to mongodb search for doc ${entity}`);
        return;
      }

      const body = {
        ..._.pick(entity, ...pkColumns),
        ...entityDefinition.options.search.source(entity),
      };

      const record: Operation = {
        index: entityDefinition.options?.search?.index || entityDefinition.name,
        id: JSON.stringify(pkColumns.map(c => entity[c])),
        action: "upsert",
        body,
      };

      logger.info(`Add operation upsert to to mongodb search for doc ${record.id}`);

      this.proceed(record);
    });
  }

  public async remove(entities: any[]) {
    entities.forEach(entity => {
      const { entityDefinition } = getEntityDefinition(entity);
      const pkColumns = unwrapPrimarykey(entityDefinition);

      if (!entityDefinition.options?.search) {
        return;
      }

      const record: Operation = {
        index: entityDefinition.options?.search?.index || entityDefinition.name,
        id: JSON.stringify(pkColumns.map(c => entity[c])),
        action: "remove",
      };

      logger.info(`Add operation remove from to mongodb search for doc ${record.id}`);

      this.proceed(record);
    });
  }

  private async proceed(operation: Operation) {
    const collection = this.mongodb.collection(`${searchPrefix}${operation.index}`);
    if (operation.action === "remove") {
      await collection.deleteOne({ id: operation.id });
    }
    if (operation.action === "upsert") {
      await collection.updateOne(
        { id: operation.id },
        { $set: { ...{ id: operation.id }, ...operation.body } },
        { upsert: true },
      );
    }
  }

  public async search<EntityType>(
    table: string,
    entityType: EntityTarget<EntityType>,
    filters: FindFilter,
    options: FindOptions = {},
  ) {
    const instance = new (entityType as any)();
    const { entityDefinition } = getEntityDefinition(instance);

    return new ListResult(entityDefinition.type, [], new Pagination());
  }
}
