import { RequestParams } from "@elastic/elasticsearch";
import { TransportRequestOptions } from "@elastic/elasticsearch/lib/Transport";
import _ from "lodash";
import { logger } from "../../../../../../core/platform/framework/logger";
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
        boost: 1.0,
      },
    },
  };

  if (Object.keys(filters || {}).length > 0) {
    esBody.query.bool.must = esBody.query.bool.must || {};
    esBody.query.bool.must.term = esBody.query.bool.must.term || {};
    for (const [key, value] of Object.entries(filters)) {
      esBody.query.bool.must.term[key] = value;
    }
  }

  if (options.$in?.length) {
    esBody.query.bool.must = esBody.query.bool.must || {};
    esBody.query.bool.must.terms = esBody.query.bool.must.terms || {};
    for (const inOperation of options.$in) {
      esBody.query.bool.must.terms[inOperation[0]] = inOperation[1];
    }
  }

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

  //TODO implement regex search

  logger.debug(`Elasticsearch query: ${JSON.stringify(esBody)}`);

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
