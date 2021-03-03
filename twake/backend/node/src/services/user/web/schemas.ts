export const userSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    connected: { type: "boolean" },
    creationdate: { type: "string" },
    firstname: { type: "string" },
    lastname: { type: "string" },
    usernamecanonical: { type: "string" },
    emailcanonical: { type: "string" },
    phone: { type: "string" },
    timezone: { type: "string" },
    groups: { type: "array" },
  }
};

export const getUserSchema = {
  response: {
    "2xx": {
      type: "object",
      properties: {
        resource: userSchema,
      },
      required: ["resource"],
    },
  },
};

