const webSocketSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    room: { type: "string" },
    encryption_key: { type: "string" },
  },
};

const channelMemberSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    user_id: { type: "string" },
    channel_id: { type: "string" },
    company_id: { type: "string" },
    workspace_id: { type: "string" },
    type: { type: "string" },
    favorite: { type: "boolean" },
    notification_level: { type: "string" },
  },
};

const channelSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    company_id: { type: "string" },
    workspace_id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    archivation_date: { type: "number" },
    archived: { type: "boolean" },
    channel_group: { type: "string" },
    connectors: { type: ["array", "null"] },
    icon: { type: "string" },
    is_default: { type: "boolean" },
    direct_channel_members: { type: ["array", "null"] },
    members: { type: ["array", "null"] },
    owner: { type: "string" },
    visibility: { type: "string" },
    user_member: channelMemberSchema,
  },
};

const channelTabSchema = {
  type: "object",
  properties: {
    company_id: { type: "string" },
    workspace_id: { type: "string" },
    channel_id: { type: "string" },
    id: { type: "string" },
    owner: { type: "string" },
    order: { type: "string" },
    configuration: {
      type: "object",
      properties: {
        board_id: { type: "string" },
        directory_id: { type: "string" },
      },
    },
    application_id: { type: "string" },
    name: { type: "string" },
  },
};

export const createChannelSchema = {
  body: {
    type: "object",
    properties: {
      options: {
        type: "object",
        properties: {
          members: { type: "array" },
        },
      },
      resource: {
        type: "object",
      },
    },
    required: ["resource"],
  },
  response: {
    201: {
      type: "object",
      properties: {
        websocket: webSocketSchema,
        resource: channelSchema,
      },
      required: ["resource"],
    },
  },
};

export const updateChannelSchema = {
  body: {
    type: "object",
    properties: {
      resource: {
        type: "object",
      },
    },
    required: ["resource"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        websocket: webSocketSchema,
        resource: channelSchema,
      },
      required: ["resource"],
    },
  },
};

export const getChannelSchema = {
  request: {
    properties: {
      company_id: { type: "string" },
      workspace_id: { type: "string" },
    },
    required: ["company_id", "workspace_id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        websocket: webSocketSchema,
        resource: channelSchema,
      },
    },
  },
};

export const getChannelMemberSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        websocket: webSocketSchema,
        resource: channelMemberSchema,
      },
      required: ["resource"],
    },
  },
};

export const createChannelMemberSchema = {
  body: {
    type: "object",
    properties: {
      resource: channelMemberSchema,
    },
    required: ["resource"],
  },
  response: {
    201: {
      type: "object",
      properties: {
        websocket: webSocketSchema,
        resource: channelMemberSchema,
      },
      required: ["resource"],
    },
  },
};

export const updateChannelMemberSchema = {
  body: {
    type: "object",
    properties: {
      resource: {
        type: "object",
        properties: {
          favorite: { type: "boolean" },
          notification_level: { type: "string" },
        },
      },
    },
    required: ["resource"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        websocket: webSocketSchema,
        resource: channelMemberSchema,
      },
      required: ["resource"],
    },
  },
};

export const getChannelTabSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        websocket: webSocketSchema,
        resource: channelTabSchema,
      },
      required: ["resource"],
    },
  },
};

export const createChannelTabSchema = {
  body: {
    type: "object",
    properties: {
      resource: {
        type: "object",
        properties: {},
      },
    },
    required: ["resource"],
  },
  response: {
    201: {
      type: "object",
      properties: {
        websocket: webSocketSchema,
        resource: channelTabSchema,
      },
      required: ["resource"],
    },
  },
};

export const updateChannelTabSchema = {
  body: {
    type: "object",
    properties: {
      resource: {
        type: "object",
        properties: {},
      },
    },
    required: ["resource"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        websocket: webSocketSchema,
        resource: channelTabSchema,
      },
      required: ["resource"],
    },
  },
};
