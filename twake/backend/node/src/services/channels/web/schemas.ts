export const createChannelSchema = {
  body: {
    type: "object",
    properties: {
      creator: {
        type: "string",
      },
      name: {
        type: "string"
      }
    },
    required: ["creator", "name"]
  },
  response: {
    201: {
      type: "object",
      properties: {
        id: { type: "string"},
        name: { type: "string"}
      },
      required: ["id", "name"]
    }
  }
};

export const getChannelSchema =  {
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "string"},
        name: { type: "string"}
      },
      required: ["id", "name"]
    }
  }
};