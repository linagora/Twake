import { expandStringForPrefix } from "../../../core/platform/services/search/adapters/utils";
import User from "./user";

export default {
  index: "user",
  source: (entity: User) => {
    let source: any = {
      first_name: entity.first_name,
      last_name: entity.last_name,
      email: entity.email_canonical,
      username: entity.username_canonical,
      prefix: expandStringForPrefix(
        entity.first_name +
          " " +
          entity.last_name +
          " " +
          entity.email_canonical.split("@")[0] +
          " " +
          entity.username_canonical,
      ),
    };
    if (entity.cache?.companies) {
      return {
        companies: entity.cache?.companies,
        ...source,
      };
    }
    return source;
  },
  mongoMapping: {
    text: {
      first_name: "text",
      last_name: "text",
      email: "text",
      username: "text",
      prefix: "text",
    },
  },
  esMapping: {
    properties: {
      first_name: { type: "text", index_prefixes: {} },
      last_name: { type: "text", index_prefixes: {} },
      email: { type: "text", index_prefixes: {} },
      username: { type: "text", index_prefixes: {} },
      companies: { type: "keyword" },
    },
  },
};
