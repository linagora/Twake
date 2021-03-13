import crypto, { randomBytes } from "crypto";
import _ from "lodash";
import { ColumnDefinition, EntityDefinition } from "./types";

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

export function unwrapPrimarykey(entityDefinition: EntityDefinition): string[] {
  const partitionKey = entityDefinition.options.primaryKey.shift();
  const primaryKey: string[] = [
    ...(typeof partitionKey === "string" ? [partitionKey] : partitionKey),
    ...(entityDefinition.options.primaryKey as string[]),
  ];
  return primaryKey;
}
