import { Channel } from "./channel";

export default {
  index: "channel",
  source: (entity: Channel) => {
    return {
      workspace_id: entity.workspace_id,
      company_id: entity.company_id,
      name: entity.channel_group + " " + entity.name,
    };
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
