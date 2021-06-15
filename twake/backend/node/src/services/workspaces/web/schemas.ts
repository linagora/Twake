import { userObjectSchema } from "../../user/web/schemas";

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
    role: { type: "string", enum: ["admin", "member"] },
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

const workspaceUserObjectSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    company_id: { type: "string" },
    workspace_id: { type: "string" },
    user_id: { type: "string" },
    created_at: { type: "number" },
    role: { type: "string", enum: ["moderator", "member"] },
    user: userObjectSchema,
  },
};

export const getWorkspaceUsersSchema = {
  response: {
    "2xx": {
      type: "object",
      properties: {
        resources: { type: "array", items: workspaceUserObjectSchema },
      },
      required: ["resources"],
    },
  },
};

export const getWorkspaceUserSchema = {
  response: {
    "2xx": {
      type: "object",
      properties: {
        resource: workspaceUserObjectSchema,
      },
      required: ["resource"],
    },
  },
};

export const createWorkspaceUserSchema = {
  body: {
    type: "object",
    properties: {
      resource: {
        type: "object",
        properties: {
          user_id: { type: "string" },
          role: { type: "string", enum: ["admin", "member"] },
        },
        required: ["user_id", "role"],
      },
    },
    required: ["resource"],
  },
  response: {
    "2xx": {
      type: "object",
      properties: {
        resource: workspaceUserObjectSchema,
      },
      required: ["resource"],
    },
  },
};

export const inviteWorkspaceUserSchema = {
  body: {
    type: "object",
    properties: {
      invitations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            email: { type: "string" },
            role: { type: "string", enum: ["admin", "member"] },
            company_role: { type: "string", enum: ["owner", "admin", "member", "guest"] },
          },
          required: ["email", "role", "company_role"],
        },
      },
    },
    required: ["invitations"],
  },
  response: {
    "2xx": {
      type: "object",
      properties: {
        resource: workspaceUserObjectSchema,
      },
      result: {
        type: "array",
        items: {
          type: "object",
          properties: {
            email: { type: "string" },
            status: { type: "string", enum: ["ok", "error"] },
            message: { type: "string" },
          },
        },
      },
    },
  },
};

export const updateWorkspaceUserSchema = {
  body: {
    type: "object",
    properties: {
      resource: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["admin", "member"] },
        },
        required: ["role"],
      },
    },
    required: ["resource"],
  },
  response: {
    "2xx": {
      type: "object",
      properties: {
        resource: workspaceUserObjectSchema,
      },
      required: ["resource"],
    },
  },
};

export const deleteWorkspaceUserSchema = {
  response: {
    "2xx": {
      type: "object",
      // properties: {
      //   resource: workspaceObjectSchema,
      // },
      // required: ["resource"],
    },
  },
};
