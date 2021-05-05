import { ColumnDefinition, ColumnType } from "../types";

export function Column(
  name: string,
  type: ColumnType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: ColumnDefinition["options"] = { order: "ASC" },
): PropertyDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: Object, key: string): void {
    target.constructor.prototype._columns = target.constructor.prototype._columns || {};
    const colDefinition: ColumnDefinition = { type: type, options: options, nodename: key };
    target.constructor.prototype._columns[name] = colDefinition;
  };
}
