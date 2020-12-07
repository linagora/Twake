import { Connector } from "../connectors";

export type RepositoryOptions = any;

/**
 * Repository manager
 */
export default class Repository<Table> {
  constructor(
    readonly connector: Connector,
    readonly table: string,
    readonly options: RepositoryOptions = {},
  ) {}

  checkEntityDefinition(entityType: Table) {
    //TODO, check entity definition make sense
    return true;
  }

  async init(entityType: Table): Promise<this> {
    const instance = new (entityType as any)();

    if (this.checkEntityDefinition(entityType)) {
      const entityConfituration = instance.constructor.prototype._entity;
      const entityColumns = instance.constructor.prototype._columns;
      await this.connector.createTable(entityConfituration, entityColumns);
    }

    return this;
  }
}
