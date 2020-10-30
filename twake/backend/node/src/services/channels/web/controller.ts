import { plainToClass } from "class-transformer";
import { FastifyReply, FastifyRequest } from "fastify";
import { CrudController } from "../../../core/platform/services/webserver/types";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { getWebsocketInformation, getWorkspaceRooms } from "../realtime";
import { WorkspaceExecutionContext } from "../types";
import { BaseChannelsParameters, ChannelCreateResponse, ChannelDeleteResponse, ChannelGetResponse, ChannelListQueryParameters, ChannelListResponse, ChannelParameters, CreateChannelBody } from "./types";

export class ChannelCrudController implements CrudController<ChannelGetResponse, ChannelCreateResponse, ChannelListResponse, ChannelDeleteResponse> {
  constructor(protected service: ChannelServiceAPI) {}

  getExecutionContext(request: FastifyRequest<{ Params: BaseChannelsParameters }>): WorkspaceExecutionContext {
    return {
      user: request.currentUser,
      url: request.url,
      method: request.routerMethod,
      transport: "http",
      workspace: {
        company_id: request.params.company_id,
        workspace_id: request.params.workspace_id
      }
    };
  }

  async get(request: FastifyRequest<{ Params: ChannelParameters }>, reply: FastifyReply): Promise<ChannelGetResponse> {
    const resource = await this.service.get(request.params.id, this.getExecutionContext(request));

    if (!resource) {
      throw reply.notFound(`Channel ${request.params.id} not found`);
    }

    return {
      websocket: getWebsocketInformation(resource),
      resource
    };
  }

  async save(request: FastifyRequest<{ Body: CreateChannelBody, Params: ChannelParameters }>, reply: FastifyReply): Promise<ChannelCreateResponse> {
    const entity = plainToClass(Channel, {
      ...request.body,
      ...{
        company_id: request.params.company_id,
        workspace_id: request.params.workspace_id
      }
    });

    const result = await this.service.create(entity, this.getExecutionContext(request));

    if (result.entity) {
      reply.code(201);
    }

    return {
      websocket: getWebsocketInformation(result.entity),
      resource: result.entity
    };
  }

  async list(request: FastifyRequest<{ Querystring: ChannelListQueryParameters, Params: BaseChannelsParameters }>): Promise<ChannelListResponse> {
    const resources = await this.service.list(this.getExecutionContext(request));

    return {
      ...{
        resources
      },
      ...(request.query.websockets && { websockets: getWorkspaceRooms(request.params, request.currentUser, request.query.mine) })
    };
  }

  async delete(request: FastifyRequest<{ Params: ChannelParameters }>, reply: FastifyReply): Promise<ChannelDeleteResponse> {
    const deleteResult = await this.service.delete(request.params.id, this.getExecutionContext(request));

      if (deleteResult.deleted) {
        reply.code(204);

        return {
          status: "success"
        };
      }

      return {
        status: "error"
      };
    }
}
