import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { BaseChannelsParameters, ChannelParameters, CreateChannelBody, ChannelListQueryParameters, ChannelListResponse, ChannelGetResponse, ChannelCreateResponse, ChannelDeleteResponse } from "./types";
import { createChannelSchema, getChannelSchema } from "./schemas";
import ChannelController from "./controller";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { checkCompanyAndWorkspaceForUser } from "./middleware";
import { FastifyRequest } from "fastify/types/request";
import { getWebsocketInformation } from "../realtime";

const url = "/companies/:company_id/workspaces/:workspace_id/channels";

const routes: FastifyPluginCallback<{ service: ChannelServiceAPI<Channel> }> = (fastify: FastifyInstance, options, next) => {
  const controller = new ChannelController(options.service);

  const accessControl = async (request: FastifyRequest<{ Params: BaseChannelsParameters }>) => {
    const authorized = await checkCompanyAndWorkspaceForUser(request.params.company_id, request.params.workspace_id);

    if (!authorized) {
      throw fastify.httpErrors.badRequest("Invalid company/workspace");
    }
  };

  fastify.route<{ Querystring: ChannelListQueryParameters, Params: BaseChannelsParameters }>({
    method: "GET",
    url,
    preHandler: accessControl,
    handler: async (req): Promise<ChannelListResponse> => {
      req.log.info(`Get channels ${req.params}`);

      const resources = await controller.getChannels(req.params, req.query);

      return {
        websockets: resources.map(channel => getWebsocketInformation(channel)),
        resources,
        next_page_token: ""
      };
    }
  });

  fastify.route<{ Params: ChannelParameters }>({
    method: "GET",
    url: `${url}/:id`,
    preHandler: accessControl,
    schema: getChannelSchema,
    handler: async (req): Promise<ChannelGetResponse> => {
      req.log.info(`Get channel ${req.params}`);

      const resource = await controller.getChannel(req.params);

      if (!resource) {
        throw fastify.httpErrors.notFound(`Channel ${req.params.id} not found`);
      }

      return {
        websocket: getWebsocketInformation(resource),
        resource
      };
    }
  });

  fastify.route<{ Body: { resource: CreateChannelBody }, Params: ChannelParameters }>({
    method: "POST",
    url: `${url}/:id`,
    preHandler: accessControl,
    schema: createChannelSchema,
    handler: async (request, reply): Promise<ChannelCreateResponse> => {
      request.log.debug(`Save Channel ${JSON.stringify(request.body)}`);
      const resource = await controller.save(request.params, request.body.resource);

      if (resource) {
        reply.code(200);
      }

      return {
        websocket: getWebsocketInformation(resource),
        resource
      };
    }
  });

  fastify.route<{ Params: ChannelParameters }>({
    method: "DELETE",
    url: `${url}/:id`,
    preHandler: accessControl,
    handler: async (request, reply): Promise<ChannelDeleteResponse> => {
      const removed = await controller.remove(request.params);

      if (removed) {
        reply.code(204);

        return {
          status: "success",

        };
      }

      return {
        status: "error"
      };
    }
  });

  next();
};

export default routes;