import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { BaseChannelsParameters, ChannelParameters } from "./types";
import { createChannelSchema, getChannelSchema, updateChannelSchema } from "./schemas";
import { ChannelCrudController, ChannelMemberCrudController } from "./controllers";
import ChannelServiceAPI from "../provider";
import { checkCompanyAndWorkspaceForUser } from "./middleware";
import { FastifyRequest } from "fastify/types/request";

const channelsUrl = "/companies/:company_id/workspaces/:workspace_id/channels";
const membersUrl = `${channelsUrl}/:id/members`;

const routes: FastifyPluginCallback<{ service: ChannelServiceAPI }> = (
  fastify: FastifyInstance,
  options,
  next,
) => {
  const channelsController = new ChannelCrudController(options.service.channels);
  const membersController = new ChannelMemberCrudController(options.service.members);

  const accessControl = async (request: FastifyRequest<{ Params: BaseChannelsParameters }>) => {
    const authorized = await checkCompanyAndWorkspaceForUser(
      request.params.company_id,
      request.params.workspace_id,
    );

    if (!authorized) {
      throw fastify.httpErrors.badRequest("Invalid company/workspace");
    }
  };

  // channels

  fastify.route({
    method: "GET",
    url: channelsUrl,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    handler: channelsController.list.bind(channelsController),
  });

  fastify.route({
    method: "GET",
    url: `${channelsUrl}/:id`,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: getChannelSchema,
    handler: channelsController.get.bind(channelsController),
  });

  fastify.route({
    method: "POST",
    url: channelsUrl,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: createChannelSchema,
    handler: channelsController.save.bind(channelsController),
  });

  fastify.route({
    method: "POST",
    url: `${channelsUrl}/:id`,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: updateChannelSchema,
    handler: channelsController.update.bind(channelsController),
  });

  fastify.route<{ Params: ChannelParameters }>({
    method: "DELETE",
    url: `${channelsUrl}/:id`,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    handler: channelsController.delete.bind(channelsController),
  });

  // members

  fastify.route({
    method: "GET",
    url: membersUrl,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    handler: membersController.list.bind(membersController),
  });

  next();
};

export default routes;
