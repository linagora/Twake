export const consoleHookSchema = {
  querystring: {
    type: "object",
    properties: {
      secret_key: { type: "string" },
    },
    required: ["secret_key"],
  },
  body: {
    type: "object",
    properties: {
      type: { type: "string" },
      content: { type: "object" },
      signature: { type: "string" },
    },
    required: ["type", "content"],
  },
  response: {
    "2xx": {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
      },
    },
  },
};
