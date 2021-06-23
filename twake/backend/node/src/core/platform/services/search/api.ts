import { TwakeServiceProvider } from "../../framework";
import { ListResult, Pagination } from "../../framework/api/crud-service";
import {
  FindFilter as ormFindFilter,
  FindOptions as ormFindOptions,
} from "../database/services/orm/repository/repository";
import { DatabaseTableCreatedEvent, EntityTarget } from "../database/services/orm/types";
export { getEntityDefinition, unwrapPrimarykey } from "../database/services/orm/utils";
export {
  DatabaseEntitiesRemovedEvent,
  DatabaseEntitiesSavedEvent,
  DatabaseTableCreatedEvent,
  EntityDefinition,
  EntityTarget,
} from "../database/services/orm/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FindFilter = ormFindFilter;

type textType = {
  $search: string;
  $caseSensitive: boolean; //Default false
  $diacriticSensitive: boolean; //Default false
};

export type FindOptions = ormFindOptions & {
  $text?: textType;
};

export type IndexedEntity = {
  primaryKey: { [key: string]: any };
  score: number;
};

export interface SearchAdapter {
  connect(): Promise<void>;
  createIndex(event: DatabaseTableCreatedEvent): Promise<void>;
  upsert(entities: any[]): Promise<void>;
  remove(entities: any[]): Promise<void>;

  search<Entity>(
    table: string,
    entityType: EntityTarget<Entity>,
    filters: FindFilter,
    options: FindOptions,
  ): Promise<ListResult<IndexedEntity>>;
}

export interface SearchServiceAPI extends TwakeServiceProvider {
  search<Entity>(
    table: string,
    entityType: EntityTarget<Entity>,
    filters: FindFilter,
    options: FindOptions,
  ): Promise<ListResult<Entity>>;
}

export type SearchConfiguration = {
  type?: false | "elasticsearch";
  elasticsearch?: {
    endpoint: string;
    flushInterval: number; //In milliseconds
  };
};
