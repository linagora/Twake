import { FastifyInstance, FastifyPluginCallback, RouteShorthandOptions } from "fastify";
import { ChannelParams, CreateChannelBody } from "./types";
import * as controller from "./controller";
import Channel from "../entity/channel";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, _opts, next) => {
  fastify.get("/", async (req): Promise<Channel[]> => {
    req.log.info("Get channels");

    return controller.getChannels();
  });

  fastify.get<{
    Params: ChannelParams,
  }>("/:id", async (req): Promise<Channel> => {
    req.log.info(`Get channel ${req.params.id}`);
    return controller.getChannel(req.params.id);
  });

  const createOptions: RouteShorthandOptions = {
    schema: {
      body: {
        type: "object",
        properties: {
          creator: {
            type: "string",
          },
          text: {
            type: "string"
          }
        }
      }
    }
  };

  fastify.post<{
    Body: CreateChannelBody
  }>("/", createOptions, async (req): Promise<Channel> => {
    req.log.info(`Creating Channel ${JSON.stringify(req.body)}`);
    return new Channel("1");
  });

  next();
};

export default routes;