import { expandStringForPrefix } from "../../../core/platform/services/search/adapters/utils";
import Application from "./application";

export default {
  index: "application",
  source: (entity: Application) => {
    return {
      company_id: entity.company_id,
      name: entity.identity.name,
      expanded_name: expandStringForPrefix(entity.identity.name),
      description: entity.identity.description,
      categories: entity.identity.categories,
      compatibility: entity.identity.compatibility,
      published: entity.publication.published,
      createdAt: entity.stats.createdAt,
    };
  },
  mongoMapping: {
    text: {
      name: "text",
      expanded_name: "text",
      description: "text",
    },
  },
  esMapping: {
    properties: {
      company_id: { type: "keyword" },
      name: { type: "text" },
      expanded_name: { type: "text" },
      description: { type: "text" },
      categories: { type: "keyword" },
      compatibility: { type: "keyword" },
      published: { type: "boolean" },
      createdAt: { type: "number" },
    },
  },
};
