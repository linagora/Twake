import _ from "lodash";
import { buildSelectQuery } from "../../../database/services/orm/connectors/mongodb/query-builder";
import { EntityTarget, FindFilter, FindOptions, getEntityDefinition } from "../../api";
import { asciiFold } from "../utils";

export function buildSearchQuery<Entity>(
  entityType: EntityTarget<Entity>,
  filters: FindFilter,
  options: FindOptions = {},
): { project: any; query: any; sort: any } {
  let project: any = false;
  let query: any = {};
  try {
    query = buildSelectQuery(entityType, filters, options);
  } catch (e) {
    console.log(e);
  }
  let sort: any = {};

  //Build text searches
  if (options.$text) {
    project = { score: { $meta: "textScore" } };
    sort = { score: -1 };
    if (options?.$text?.$search)
      options.$text.$search = _.lowerCase(asciiFold(options.$text.$search || ""));
    query.$text = options.$text || undefined;

    console.log("SEARCH $TEXT = ", JSON.stringify(options.$text));
  }

  //Build regexes
  if (options.$regex) {
    options.$regex.forEach(r => {
      //r: [Field, regex, options]
      if (r.length >= 2) {
        const field = r[0];
        query[field] = query[field] || {};
        query[field].$regex = r[1];
        if (r[2]) query[field].$options = r[2];
      }
    });
  }

  console.log("SEARCH QUERY = ", JSON.stringify(query));

  return {
    project,
    query,
    sort,
  };
}
