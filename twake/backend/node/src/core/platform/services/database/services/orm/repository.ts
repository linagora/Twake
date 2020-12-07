import { Connector } from "../connectors";
import { getEntityDefinition } from "./decorators";

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
      const { columnsDefinition, entityDefinition } = getEntityDefinition(instance);
      await this.connector.createTable(entityDefinition, columnsDefinition);
    }

    return this;
  }
}
