import { expandStringForPrefix } from "../../../core/platform/services/search/adapters/utils";
import { Message } from "./messages";

export default {
  index: "messages",
  source: (entity: Message) => {
    const source: any = {
      text: entity.text,
    };
    if (entity.cache) {
      return {
        company_id: entity.cache?.company_id,
        workspace_id: entity.cache?.workspace_id,
        channel_id: entity.cache?.channel_id,
        ...source,
      };
    }
    return source;
  },
  mongoMapping: {
    text: {
      text: "text",
    },
  },
  esMapping: {
    properties: {
      text: { type: "text" },
      company_id: { type: "keyword" },
      workspace_id: { type: "keyword" },
      channel_id: { type: "keyword" },
    },
  },
};
