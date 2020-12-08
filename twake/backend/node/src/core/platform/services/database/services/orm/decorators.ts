import _ from "lodash";
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
    const colDefinition: ColumnDefinition = { type: type, options: options, nodename: key };
    target.constructor.prototype._columns[name] = colDefinition;
  };
}
