import { FastifyInstance, FastifyPluginCallback, RouteShorthandOptions } from "fastify";
import { ChannelParams, CreateChannelBody } from "./types";
import { createChannelSchema } from "./schemas";
import * as controller from "./controller";
import Channel from "../entity/channel";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, _opts, next) => {
  fastify.get("/", async (req): Promise<Channel[]> => {
    req.log.debug("Get channels");

    return controller.getChannels();
  });

  fastify.get<{
    Params: ChannelParams,
  }>("/:id", async (req): Promise<Channel> => {
    req.log.debug(`Get channel ${req.params.id}`);
    return controller.getChannel(req.params.id);
  });

  const createOptions: RouteShorthandOptions = {
    schema: createChannelSchema
  };

  fastify.post<{
    Body: CreateChannelBody
  }>("/", createOptions, async (request, reply) => {
    request.log.debug(`Creating Channel ${JSON.stringify(request.body)}`);

    const channel = await controller.create(request.body);

    reply.status(201).send(channel);
  });

  next();
};

export default routes;