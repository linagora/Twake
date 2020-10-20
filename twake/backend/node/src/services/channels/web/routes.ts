import { FastifyInstance, FastifyPluginCallback, RouteShorthandOptions } from "fastify";
import { ChannelParams, CreateChannelBody } from "./types";
import { createChannelSchema, getChannelSchema } from "./schemas";
import ChannelController from "./controller";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";

const routes: FastifyPluginCallback<{ service: ChannelServiceAPI<Channel> }> = (fastify: FastifyInstance, options, next) => {
  const controller = new ChannelController(options.service);
  const createOptions: RouteShorthandOptions = { schema: createChannelSchema };
  const getOptions: RouteShorthandOptions = { schema: getChannelSchema };

  fastify.get("/", async (req): Promise<Channel[]> => {
    req.log.debug("Get channels");

    return controller.getChannels();
  });

  fastify.get<{ Params: ChannelParams }>("/:id", getOptions, async (req): Promise<Channel> => {
    req.log.info(`Get channel ${req.params.id}`);

    const channel = await controller.getChannel(req.params.id);

    if (!channel) {
      throw fastify.httpErrors.notFound(`Channel ${req.params.id} not found`);
    }

    return channel;
  });

  fastify.post<{ Body: CreateChannelBody }>("/", createOptions, async (request, reply) => {
    request.log.debug(`Creating Channel ${JSON.stringify(request.body)}`);

    const channel = await controller.create(request.body);

    reply.status(201).send(channel);
  });

  fastify.delete<{ Params: ChannelParams }>("/:id", async (request, reply) => {
    await controller.remove(request.params.id);

    reply.status(204).send();
  });

  next();
};

export default routes;