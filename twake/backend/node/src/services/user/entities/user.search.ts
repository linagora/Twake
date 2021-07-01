import User from "./user";

export default {
  index: "user",
  source: (entity: User) => {
    let source: any = {
      first_name: entity.first_name,
      last_name: entity.last_name,
      email_canonical: entity.email_canonical,
    };
    if (entity.cache?.companies && entity.cache?.workspaces) {
      return {
        companies: entity.cache?.companies,
        workspaces: entity.cache?.workspaces,
        ...source,
      };
    }
    return source;
  },
  mongoMapping: {
    text: {
      first_name: "text",
      last_name: "text",
      email_canonical: "text",
    },
  },
  esMapping: {
    properties: {
      first_name: { type: "text" },
      last_name: { type: "text" },
      email_canonical: { type: "text" },
      companies: { type: "keyword" },
      workspaces: { type: "keyword" },
    },
  },
};
