const webSocketSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    room: { type: "string" },
    encryption_key: { type: "string" }
  }
};

export const createChannelSchema = {
  body: {
    type: "object",
    properties: {
      resource: {
        type: "object",
        properties: {
          compagny_id: {
            type: "string",
          },
          workspace_id: {
            type: "string"
          },
          id: {
            type: "string",
          },
          owner: {
            type: "string"
          },
          icon: {
            type: "string",
          },
          name: {
            type: "string"
          },
          description: {
            type: "string",
          },
          channel_groupe: {
            type: "string"
          },
          visibility: {
            type: "string",
          },
          defaut: {
            type: "string"
          },
          archived: {
            type: "string",
          },
          archivation_date: {
            type: "string"
          }

        },
        required: ["company_id", "workspace_id", "id", "owner", "icon", "name", "description", "channel_group", "visibility", "default", "archived", "archivation_date"]
      },
    },
    required: ["resource"]
  },
  response: {
    201: {
      type: "object",
      properties: {
        websocket: webSocketSchema,
        resource: {
          type: "object",
          properties: {
            id: { type: "string" },
            company_id: { type: "string" },
            workspace_id: { type: "string" }
          },
          required: ["id", "company_id", "workspace_id"]
        }
      },
      required: ["resource"]
    }
  }
};

export const getChannelSchema = {
  request: {
    properties: {
      company_id: { type: "string" },
      workspace_id: { type: "string" }
    },
    required: ["company_id", "workspace_id"]
  },
  response: {
    200: {
      type: "object",
      properties: {
        websocket: webSocketSchema,
        resource: {
          type: "object",
          properties: {
            id: { type: "string" },
            company_id: { type: "string" },
            workspace_id: { type: "string" },
            name: { type: "string" },
          },
          required: ["id", "company_id", "workspace_id", "name"]
        }
      }
    }
  }
};