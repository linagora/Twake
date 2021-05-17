export const _userSchema = {
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
  },
};

export const userSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    provider: { type: "string" },
    provider_id: { type: "string" },

    email: { type: "string" },
    is_verified: { type: "boolean" },
    picture: { type: "string" },
    first_name: { type: "string" },
    last_name: { type: "string" },
    created_at: { type: "number" },
    deleted: { type: "boolean" },

    status: { type: "string" },
    last_activity: { type: "number" },

    //Below is only if this is myself

    preference: {
      type: "object",
      properties: {
        locale: { type: "string" },
        timezone: { type: "number" },
      },
    },

    companies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["owner", "admin", "member", "guest"] },
          status: { type: "string", enum: ["owner", "deactivated", "invited"] },
          company: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              logo: { type: "string" },
            },
          },
        },
      },
    },
  },
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

export const getUsersSchema = {
  type: "object",
  properties: {
    user_ids: { type: "string" },
    include_companies: { type: "boolean" },
  },
  response: {
    "2xx": {
      type: "object",
      properties: {
        resources: { type: "array", items: userSchema },
      },
      required: ["resources"],
    },
  },
};
