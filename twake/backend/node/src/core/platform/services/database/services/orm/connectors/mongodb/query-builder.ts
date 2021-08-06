import { FindOptions } from "../../repository/repository";
import { ObjectType } from "../../types";
import { getEntityDefinition, secureOperators } from "../../utils";
import { transformValueToDbString } from "./typeTransforms";

export function buildSelectQuery<Entity>(
  entityType: ObjectType<Entity>,
  filters: any,
  findOptions: FindOptions,
  options: {
    secret?: string;
    keyspace: string;
  } = {
    secret: "",
    keyspace: "twake",
  },
): any {
  const instance = new (entityType as any)();
  const { columnsDefinition, entityDefinition } = getEntityDefinition(instance);

  let where: any = {};
  Object.keys(filters).forEach((key: string) => {
    if (Array.isArray(filters[key])) {
      if (!filters[key] || !filters[key].length) {
        return;
      }
      findOptions.$in = findOptions.$in || [];
      findOptions.$in.push([key, filters[key]]);
    } else {
      where[key] = transformValueToDbString(filters[key], columnsDefinition[key].type, {
        columns: columnsDefinition[key].options,
        secret: options.secret,
        disableSalts: true,
      });
    }
  });

  findOptions = secureOperators(transformValueToDbString, findOptions, entityType, options);
  where = buildComparison(where, findOptions);
  where = buildIn(where, findOptions);

  return where;
}

export function buildComparison(where: any, options: FindOptions = {}): string[] {
  Object.keys(options).forEach(operator => {
    if (operator === "$gt" || operator === "$gte" || operator === "$lt" || operator === "$lte") {
      (options[operator] || []).forEach(element => {
        if (!where[element[0]]) where[element[0]] = {};
        where[element[0]][operator] = element[1];
      });
    }
  });

  return where;
}

export function buildIn(where: any, options: FindOptions = {}): any {
  if (options.$in) {
    options.$in.forEach(element => {
      if (!where[element[0]]) where[element[0]] = {};
      where[element[0]]["$in"] = element[1];
    });
  }

  return where;
}
