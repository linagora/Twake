import { Pagination } from "../../../../../platform/framework/api/crud-service";
import { Connector } from "./connectors";
import { getEntityDefinition } from "./utils";

export type RepositoryOptions = {};

export type FindFilter = { [key: string]: any };

export type FindOptions = {
  pagination?: Pagination;
};

/**
 * Repository manager
 */
export default class Repository<EntityType> {
  private entityType: EntityType;

  constructor(
    readonly connector: Connector,
    readonly table: string,
    readonly options: RepositoryOptions = {},
  ) {}

  checkEntityDefinition(entityType: EntityType) {
    //TODO, check entity definition make sense
    return true;
  }

  async init(entityType: EntityType): Promise<this> {
    const instance = new (entityType as any)();

    if (this.checkEntityDefinition(entityType)) {
      const { columnsDefinition, entityDefinition } = getEntityDefinition(instance);
      await this.connector.createTable(entityDefinition, columnsDefinition);

      this.entityType = entityType;
      console.log("initialize ", this.table, entityType);
    }

    return this;
  }

  async find(filters: FindFilter, options: FindOptions = {}): Promise<EntityType[]> {
    if (!this.entityType) {
      throw Error(`Unable to find or findOne: EntityType ${this.table} not initialized`);
    }

    if (!options.pagination) {
      options.pagination = new Pagination("", "100");
    }

    return await this.connector.find(this.entityType, filters, options);
  }

  async findOne(filters: FindFilter, options: FindOptions = {}): Promise<EntityType> {
    if (!options.pagination) {
      options.pagination = new Pagination("", "1");
    }

    return (await this.find(filters, options))[0] || null;
  }
}
