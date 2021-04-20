import _ from "lodash";
import { FindOptions } from "../../repository/repository";
import { ObjectType } from "../../types";
import { getEntityDefinition } from "../../utils";
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
): string {
  const instance = new (entityType as any)();
  const { columnsDefinition, entityDefinition } = getEntityDefinition(instance);

  const where = Object.keys(filters)
    .map(key => {
      let result: string;
      const filter = filters[key];

      if (!filter) {
        return;
      }

      if (Array.isArray(filter)) {
        if (!filter.length) {
          return;
        }
        const inClause: string[] = filter.map(
          value =>
            `${transformValueToDbString(value, columnsDefinition[key].type, {
              columns: columnsDefinition[key].options,
              secret: options.secret || "",
            })}`,
        );

        result = `${key} IN (${inClause.join(",")})`;
      } else {
        result = `${key} = ${transformValueToDbString(filter, columnsDefinition[key].type, {
          columns: columnsDefinition[key].options,
          secret: options.secret || "",
        })}`;
      }

      return result;
    })
    .filter(Boolean);

  secureOperators(findOptions, entityType, options);

  const whereClause = `${[
    ...where,
    ...(buildComparison(findOptions) || []),
    ...(buildIn(findOptions) || []),
    ...(buildLike(findOptions) || []),
  ].join(" AND ")}`.trimEnd();

  return `SELECT * FROM ${options.keyspace}.${entityDefinition.name} ${
    whereClause.trim().length ? "WHERE " + whereClause : ""
  }`
    .trimEnd()
    .concat(";");
}

export function secureOperators<Entity>(
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
        element[1] = element[1].map((e: any) =>
          transformValueToDbString(e, columnsDefinition[element[0]].type, {
            columns: columnsDefinition[element[0]].options,
            secret: options.secret || "",
          }),
        );
      });
    }
  });

  return findOptions;
}

export function buildComparison(options: FindOptions = {}): string[] {
  let lessClause;
  let lessEqualClause;
  let greaterClause;
  let greaterEqualClause;

  if (options.$lt) {
    lessClause = options.$lt.map(element => `${element[0]} < ${element[1]}`);
  }

  if (options.$lte) {
    lessEqualClause = options.$lte.map(element => `${element[0]} <= ${element[1]}`);
  }

  if (options.$gt) {
    greaterClause = options.$gt.map(element => `${element[0]} > ${element[1]}`);
  }

  if (options.$gte) {
    greaterEqualClause = options.$gte.map(element => `${element[0]} >= ${element[1]}`);
  }

  return [
    ...(lessClause || []),
    ...(lessEqualClause || []),
    ...(greaterClause || []),
    ...(greaterEqualClause || []),
  ];
}

export function buildIn(options: FindOptions = {}): string[] {
  let inClauses: string[];
  if (options.$in) {
    inClauses = options.$in.map(element => `${element[0]} IN (${element[1].join(",")})`);
  }

  return inClauses || [];
}

export function buildLike(options: FindOptions = {}): string[] {
  let likeClauses: string[];
  if (options.$like) {
    likeClauses = options.$like.map(element => `${element[0]} LIKE '%${element[1]}%`);
  }

  return likeClauses || [];
}
