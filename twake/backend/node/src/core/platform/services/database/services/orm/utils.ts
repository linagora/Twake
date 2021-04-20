import crypto, { randomBytes } from "crypto";
import _ from "lodash";
import { FindOptions } from "./repository/repository";
import { ColumnDefinition, EntityDefinition, ObjectType } from "./types";

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

export function secureOperators<Entity>(
  transformValueToDbString: Function,
  findOptions: FindOptions = {},
  entityType: ObjectType<Entity>,
  options: {
    secret?: string;
    keyspace: string;
  } = {
    secret: "",
    keyspace: "twake",
  },
): FindOptions {
  const instance = new (entityType as any)();
  const { columnsDefinition, entityDefinition } = getEntityDefinition(instance);

  Object.keys(findOptions).forEach(key => {
    if (
      key == "$in" ||
      key == "$lte" ||
      key == "$lt" ||
      key == "$gte" ||
      key == "$gt" ||
      key == "$like"
    ) {
      findOptions[key].forEach(element => {
        if (_.isArray(element[1])) {
          element[1] = element[1].map((e: any) =>
            transformValueToDbString(e, columnsDefinition[element[0]].type, {
              columns: columnsDefinition[element[0]].options,
              secret: options.secret || "",
            }),
          );
        } else {
          element[1] = transformValueToDbString(element[1], columnsDefinition[element[0]].type, {
            columns: columnsDefinition[element[0]].options,
            secret: options.secret || "",
          });
        }
      });
    }
  });

  return findOptions;
}
