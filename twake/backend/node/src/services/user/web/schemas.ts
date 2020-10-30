export const createUserSchema = {
  body: {
    type: "object",
    properties: {
      email: {
        type: "string",
      },
    },
    required: ["email"],
  },
  response: {
    201: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
  },
};
