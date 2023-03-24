import { fileIsMedia } from "../../../services/files/utils";
import { expandFileNameForSearch } from "./message-files.search";
import { Message } from "./messages";

export default {
  index: "messages",
  source: (entity: Message) => {
    const links = (
      (entity.text || "").match(
        /(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/gi,
      ) || []
    ).join(" ");
    const source: any = {
      created_at: entity.created_at,
      text: entity.text || "",
      has_files: (entity.files || []).length > 0,
      has_medias: (entity.files || []).filter(f => fileIsMedia(f)).length > 0,
      attachments_names: (entity.files || [])
        .map(file => expandFileNameForSearch(file.metadata.name))
        .join(" "),
      links:
        links +
        " " +
        links.replace(/https?:\/\//gm, "") +
        " " +
        links.replace(/[^A-Z-a-z0-9]/gm, " "),
    };
    if (entity.cache) {
      return {
        company_id: entity.cache?.company_id,
        workspace_id: entity.cache?.workspace_id,
        channel_id: entity.cache?.channel_id,
        user_id: entity.user_id,

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
      attachments_names: { type: "text", index_prefixes: { min_chars: 1 } },
      links: { type: "text", index_prefixes: { min_chars: 1 } },
      user_id: { type: "keyword" },
      company_id: { type: "keyword" },
      workspace_id: { type: "keyword" },
      channel_id: { type: "keyword" },
      has_files: { type: "boolean" },
      has_medias: { type: "boolean" },
      created_at: { type: "number" },
    },
  },
};
