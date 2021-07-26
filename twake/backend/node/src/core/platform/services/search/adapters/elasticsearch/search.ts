import { RequestParams } from "@elastic/elasticsearch";
import { TransportRequestOptions } from "@elastic/elasticsearch/lib/Transport";
import _ from "lodash";
import { EntityTarget, FindFilter, FindOptions, getEntityDefinition } from "../../api";

export function buildSearchQuery<Entity>(
  entityType: EntityTarget<Entity>,
  filters: FindFilter,
  options: FindOptions = {},
): { esParams: RequestParams.Search; esOptions: TransportRequestOptions } {
  const instance = new (entityType as any)();
  const { entityDefinition, columnsDefinition } = getEntityDefinition(instance);
  const indexProperties = entityDefinition.options.search.esMapping.properties || {};

  let esBody: any = {
    query: {
      bool: {
        /*
        must: {
          term: { "user.id": "kimchy" },
        },
        filter: {
          term: { tags: "production" },
        },
        must_not: {
          range: {
            age: { gte: 10, lte: 20 },
          },
        },*/
        boost: 1.0,
      },
    },
  };

  if (options.$text) {
    esBody.query.bool.minimum_should_match = 1;
    esBody.query.bool.should = esBody.query.bool.should || [];

    for (const [key, value] of Object.entries(indexProperties)) {
      if ((value as any)["type"] === "text") {
        let match: any = {};
        match[key] = {
          query: options.$text.$search,
        };
        esBody.query.bool.should.push({
          match,
        });
      }
    }
  }

  console.log(JSON.stringify(esBody));

  const esParams: RequestParams.Search = {
    index: entityDefinition.options?.search?.index || entityDefinition.name,
    body: esBody,
  };

  let esOptions: TransportRequestOptions = {
    ignore: [404],
    maxRetries: 3,
  };

  return {
    esParams,
    esOptions,
  };
}
