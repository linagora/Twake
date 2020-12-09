import { ListResult, Pagination } from "../../../../../platform/framework/api/crud-service";
import { Connector } from "./connectors";
import { getEntityDefinition } from "./utils";

export type RepositoryOptions = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  checkEntityDefinition(entityType: EntityType): boolean {
    //TODO, check entity definition make sense
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async init(entityType: any): Promise<this> {
    const instance = new (entityType as any)() as EntityType;

    if (this.checkEntityDefinition(entityType)) {
      const { columnsDefinition, entityDefinition } = getEntityDefinition(instance);
      await this.connector.createTable(entityDefinition, columnsDefinition);

      this.entityType = entityType;
    }

    return this;
  }

  async find(filters: FindFilter, options: FindOptions = {}): Promise<ListResult<EntityType>> {
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

    return (await this.find(filters, options)).getEntities()[0] || null;
  }
}
