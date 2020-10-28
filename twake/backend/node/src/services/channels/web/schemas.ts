import * as Types from "./typebox";

export const createChannelSchema = {
  body: Types.createChannelSchema,
  response: {
    201: Types.createChannelResponseSchema
  }
};

export const getChannelSchema =  {
  request: Types.channelSchema,
  response: {
    200: Types.createChannelResponseSchema
  }
};