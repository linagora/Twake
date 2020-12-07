import { ColumnDefinition, ColumnType, EntityDefinition } from "./types";

export function Entity(name: string, options: any) {
  return function (constructor: Function) {
    const entityDefinition: EntityDefinition = { name: name, options: options };
    constructor.prototype._entity = entityDefinition;
  };
}

export function Column(
  name: string,
  type: ColumnType,
  options: any = {},
): (target: any, key: string) => void {
  return function (target: Object, key: string) {
    target.constructor.prototype._columns = target.constructor.prototype._columns || {};
    const colDefinition: ColumnDefinition = { type: type, options: options };
    target.constructor.prototype._columns[name] = colDefinition;
  };
}

export function getEntityDefinition(
  instance: any,
): {
  entityDefinition: EntityDefinition;
  columnsDefinition: { [name: string]: ColumnDefinition };
} {
  const entityConfituration = _.cloneDeep(instance.constructor.prototype._entity);
  const entityColumns = _.cloneDeep(instance.constructor.prototype._columns);
  return {
    entityDefinition: entityConfituration,
    columnsDefinition: entityColumns,
  };
}
