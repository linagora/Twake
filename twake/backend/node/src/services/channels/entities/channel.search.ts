import { expandStringForPrefix } from "../../../core/platform/services/search/adapters/utils";
import { Channel } from "./channel";

export default {
  index: "user",
  source: (entity: Channel) => {
    let source: any = {
      workspace_id: entity.workspace_id,
      company_id: entity.company_id,
      name: entity.channel_group + " " + entity.name,
    };
    return source;
  },
  mongoMapping: {
    text: {
      name: "text",
    },
  },
  esMapping: {
    properties: {
      name: { type: "text", index_prefixes: {} },
      workspace_id: { type: "keyword" },
      company_id: { type: "keyword" },
    },
  },
};
