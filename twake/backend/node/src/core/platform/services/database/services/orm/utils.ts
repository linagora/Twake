import crypto, { randomBytes } from "crypto";
import _ from "lodash";
import { FindOptions } from "./repository/repository";
import { ColumnDefinition, EntityDefinition, ObjectType } from "./types";
import { v1 as uuidv1 } from "uuid";
import { flatten } from "lodash";

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
  const initial = [...entityDefinition.options.primaryKey];
  const partitionKey = initial.shift();
  const primaryKey: string[] = [
    ...(typeof partitionKey === "string" ? [partitionKey] : partitionKey),
    ...(initial as string[]),
  ];
  return primaryKey;
}

export function unwrapIndexes(entityDefinition: EntityDefinition): string[] {
  const indexes = entityDefinition.options.globalIndexes;
  if (!indexes) return [];

  return flatten(entityDefinition.options.globalIndexes);
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
        if (columnsDefinition[element[0]]) {
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
        }
      });
    }
  });

  return findOptions;
}

const microCounter = 0; //We do not really use nanotime, our goal is to ensure unicity first.

/**
 * Build uuid from nanotime
 * @param orderable
 * @returns
 */
export function fromMongoDbOrderable(orderable: string) {
  if (!orderable) {
    return null;
  }
  const uuid_arr = orderable.split("-");
  const timeuuid = [uuid_arr[2], uuid_arr[1], uuid_arr[0], uuid_arr[3], uuid_arr[4]].join("-");
  return timeuuid;
}

/**
 * Returns orderable string
 * @param timeuuid
 * @returns
 */
export function toMongoDbOrderable(timeuuid?: string): string {
  if (!timeuuid) {
    return null;
  }
  const uuid_arr = timeuuid.split("-");
  const time_str = [uuid_arr[2], uuid_arr[1], uuid_arr[0], uuid_arr[3], uuid_arr[4]].join("-");
  return time_str;
}
