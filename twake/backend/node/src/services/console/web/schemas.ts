export const consoleHookSchema = {
  querystring: {
    type: "object",
    properties: {
      secret: { type: "string" },
    },
    required: ["secret"],
  },
  body: {
    type: "object",
    properties: {
      type: { type: "string" },
      content: { type: "object" },
      signature: { type: "string" },
    },
    required: ["type", "content", "signature"],
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

export const authenticationSchema = {
  body: {
    type: "object",
    properties: {
      email: { type: "string" },
      password: { type: "string" },
      access_token: { type: "string" },
    },
  },
  response: {
    "2xx": {
      type: "object",
      properties: {
        access_token: {
          type: "object",
          properties: {
            time: { type: "number" },
            expiration: { type: "number" },
            refresh_expiration: { type: "number" },
            value: { type: "string" },
            refresh: { type: "string" },
            type: { type: "string" },
          },
        },
      },
    },
  },
};
