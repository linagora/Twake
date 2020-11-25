import { plainToClass } from "class-transformer";
import { FastifyReply, FastifyRequest } from "fastify";
import { Pagination } from "../../../../core/platform/framework/api/crud-service";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import { Channel } from "../../entities";
import { ChannelService, ChannelPrimaryKey } from "../../provider";
import { getWebsocketInformation, getWorkspaceRooms } from "../../services/channel/realtime";
import {
  BaseChannelsParameters,
  ChannelCreateResponse,
  ChannelDeleteResponse,
  ChannelGetResponse,
  ChannelListQueryParameters,
  ChannelListResponse,
  ChannelParameters,
  ChannelUpdateResponse,
  CreateChannelBody,
  UpdateChannelBody,
} from "../types";
import { WorkspaceExecutionContext } from "../../types";
import { handleError } from ".";

export class ChannelCrudController
  implements
    CrudController<
      ChannelGetResponse<Channel>,
      ChannelCreateResponse<Channel>,
      ChannelListResponse<Channel>,
      ChannelDeleteResponse
    > {
  constructor(protected service: ChannelService) {}

  getPrimaryKey(request: FastifyRequest<{ Params: ChannelParameters }>): ChannelPrimaryKey {
    return {
      id: request.params.id,
      company_id: request.params.company_id,
      workspace_id: request.params.workspace_id,
    };
  }

  async get(
    request: FastifyRequest<{ Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<ChannelGetResponse<Channel>> {
    const resource = await this.service.get(
      this.getPrimaryKey(request),
      getExecutionContext(request),
    );

    if (!resource) {
      reply.notFound(`Channel ${request.params.id} not found`);

      return;
    }

    return {
      websocket: getWebsocketInformation(resource),
      resource,
    };
  }

  async save(
    request: FastifyRequest<{ Body: CreateChannelBody; Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<ChannelCreateResponse<Channel>> {
    const entity = plainToClass(Channel, {
      ...request.body.resource,
      ...{
        company_id: request.params.company_id,
        workspace_id: request.params.workspace_id,
      },
    });

    try {
      const result = await this.service.save(entity, getExecutionContext(request));

      if (result.entity) {
        reply.code(201);
      }

      return {
        websocket: getWebsocketInformation(result.entity),
        resource: result.entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async update(
    request: FastifyRequest<{ Body: UpdateChannelBody; Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<ChannelUpdateResponse<Channel>> {
    const entity = plainToClass(Channel, {
      ...request.body.resource,
      ...{
        company_id: request.params.company_id,
        workspace_id: request.params.workspace_id,
        id: request.params.id,
      },
    });

    try {
      const result = await this.service.save(entity, getExecutionContext(request));

      if (result.entity) {
        reply.code(201);
      }

      return {
        websocket: getWebsocketInformation(result.entity),
        resource: result.entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async list(
    request: FastifyRequest<{
      Querystring: ChannelListQueryParameters;
      Params: BaseChannelsParameters;
    }>,
  ): Promise<ChannelListResponse<Channel>> {
    const list = await this.service.list(
      new Pagination(request.query.page_token, request.query.limit),
      { ...request.query },
      getExecutionContext(request),
    );

    return {
      ...{
        resources: list.entities || [],
      },
      ...(request.query.websockets && {
        websockets: getWorkspaceRooms(request.params, request.currentUser, request.query.mine),
      }),
      ...(list.page_token && {
        next_page_token: list.page_token,
      }),
    };
  }

  async delete(
    request: FastifyRequest<{ Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<ChannelDeleteResponse> {
    try {
      const deleteResult = await this.service.delete(
        this.getPrimaryKey(request),
        getExecutionContext(request),
      );

      if (deleteResult.deleted) {
        reply.code(204);

        return {
          status: "success",
        };
      }

      return {
        status: "error",
      };
    } catch (err) {
      handleError(reply, err);
    }
  }
}

function getExecutionContext(
  request: FastifyRequest<{ Params: BaseChannelsParameters }>,
): WorkspaceExecutionContext {
  return {
    user: request.currentUser,
    url: request.url,
    method: request.routerMethod,
    transport: "http",
    workspace: {
      company_id: request.params.company_id,
      workspace_id: request.params.workspace_id,
    },
  };
}
