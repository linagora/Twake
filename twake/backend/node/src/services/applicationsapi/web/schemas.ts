export const applicationsSchema = {
  type: "object",
  properties: {},
};

export const configureRequestSchema = {
  body: {
    type: "object",
    properties: {
      user_id: { type: "string" },
      connection_id: { type: "string" },
      form: {},
    },
    required: ["user_id", "connection_id"],
  },
};
