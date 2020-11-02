import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { BaseChannelsParameters, ChannelParameters } from "./types";
import { createChannelSchema, getChannelSchema, updateChannelSchema } from "./schemas";
import { ChannelCrudController } from "./controller";
import ChannelServiceAPI from "../provider";
import { checkCompanyAndWorkspaceForUser } from "./middleware";
import { FastifyRequest } from "fastify/types/request";

const url = "/companies/:company_id/workspaces/:workspace_id/channels";

const routes: FastifyPluginCallback<{ service: ChannelServiceAPI }> = (
  fastify: FastifyInstance,
  options,
  next,
) => {
  const controller = new ChannelCrudController(options.service);

  const accessControl = async (request: FastifyRequest<{ Params: BaseChannelsParameters }>) => {
    const authorized = await checkCompanyAndWorkspaceForUser(
      request.params.company_id,
      request.params.workspace_id,
    );

    if (!authorized) {
      throw fastify.httpErrors.badRequest("Invalid company/workspace");
    }
  };

  fastify.route({
    method: "GET",
    url,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    handler: controller.list.bind(controller),
  });

  fastify.route({
    method: "GET",
    url: `${url}/:id`,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: getChannelSchema,
    handler: controller.get.bind(controller),
  });

  fastify.route({
    method: "POST",
    url,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: createChannelSchema,
    handler: controller.save.bind(controller),
  });

  fastify.route({
    method: "POST",
    url: `${url}/:id`,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: updateChannelSchema,
    handler: controller.update.bind(controller),
  });

  fastify.route<{ Params: ChannelParameters }>({
    method: "DELETE",
    url: `${url}/:id`,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    handler: controller.delete.bind(controller),
  });

  next();
};

export default routes;
