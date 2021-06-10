const workspaceObjectSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    company_id: { type: "string" },
    name: { type: "string" },
    logo: { type: "string" },
    default: { type: "boolean" },
    archived: { type: "boolean" },
    stats: {
      type: "object",
      properties: {
        created_at: { type: "number" },
        total_members: { type: "number" },
      },
    },
    role: { type: "string", enum: ["moderator", "member"] },
  },
};

export const getWorkspacesSchema = {
  response: {
    "2xx": {
      type: "object",
      properties: {
        resources: { type: "array", items: workspaceObjectSchema },
      },
      required: ["resources"],
    },
  },
};

export const getWorkspaceSchema = {
  response: {
    "2xx": {
      type: "object",
      properties: {
        resource: workspaceObjectSchema,
      },
      required: ["resource"],
    },
  },
};

export const createWorkspaceSchema = {
  body: {
    type: "object",
    properties: {
      resource: {
        type: "object",
        properties: {
          name: { type: "string" },
          logo: { type: "string" },
          default: { type: "boolean" },
        },
        required: ["name", "logo", "default"],
      },
    },
    required: ["resource"],
  },
  response: {
    "2xx": {
      type: "object",
      properties: {
        resource: workspaceObjectSchema,
      },
      required: ["resource"],
    },
  },
};

export const updateWorkspaceSchema = {
  body: {
    type: "object",
    properties: {
      resource: {
        type: "object",
        properties: {
          name: { type: "string" },
          logo: { type: "string" },
          default: { type: "boolean" },
          archived: { type: "boolean" },
        },
      },
    },
    required: ["resource"],
  },
  response: {
    "2xx": {
      type: "object",
      properties: {
        resource: workspaceObjectSchema,
      },
      required: ["resource"],
    },
  },
};

export const deleteWorkspaceSchema = {
  response: {
    "2xx": {
      type: "object",
      properties: {
        resource: workspaceObjectSchema,
      },
      required: ["resource"],
    },
  },
};
