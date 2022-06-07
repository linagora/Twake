import { MessageFile } from "./message-files";

export default {
  index: "messages_files",
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

      company_id: entity.cache?.company_id,
      workspace_id: entity.cache?.workspace_id,
      channel_id: entity.cache?.channel_id,
      user_id: entity.cache?.user_id,
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
      name: { type: "text", index_prefixes: { min_chars: 1, max_chars: 20 } },
      size: { type: "number" },
      source: { type: "keyword" },
      extension: { type: "keyword" },
      is_media: { type: "boolean" },
      is_file: { type: "boolean" },
      created_at: { type: "number" },

      company_id: { type: "keyword" },
      workspace_id: { type: "keyword" },
      channel_id: { type: "keyword" },
      user_id: { type: "keyword" },
    },
  },
};
