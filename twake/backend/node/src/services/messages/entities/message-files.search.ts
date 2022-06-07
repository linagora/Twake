import { MessageFile } from "./message-files";

export default {
  index: "message_files",
  source: (entity: MessageFile) => {
    const isMedia =
      entity.metadata?.mime?.startsWith("video/") || entity.metadata?.mime?.startsWith("image/");

    const source = {
      name: entity.metadata?.name || "",
      size: entity.metadata?.size || "",
      source: entity.metadata?.source || "",
      extension: (entity.metadata?.name || "").split(".").pop() || "",
      is_media: isMedia,
      is_file: !isMedia,
      created_at: entity.created_at,

      cache_company_id: entity.cache?.company_id,
      cache_workspace_id: entity.cache?.workspace_id,
      cache_channel_id: entity.cache?.channel_id,
      cache_user_id: entity.cache?.user_id,
    };
    return source;
  },
  mongoMapping: {
    text: {
      name: "text",
    },
    prefix: {
      name: "prefix",
    },
  },
  esMapping: {
    properties: {
      name: { type: "text", index_prefixes: { min_chars: 1, max_chars: 20 } },
      size: { type: "number" },
      source: { type: "keyword" },
      extension: { type: "keyword" },
      is_media: { type: "boolean" },
      is_file: { type: "boolean" },
      created_at: { type: "number" },

      cache_company_id: { type: "keyword" },
      cache_workspace_id: { type: "keyword" },
      cache_channel_id: { type: "keyword" },
      cache_user_id: { type: "keyword" },
    },
  },
};
