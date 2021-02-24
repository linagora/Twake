import { CrudController } from "../../../../core/platform/services/webserver/types";
import { Pagination } from "../../../../core/platform/framework/api/crud-service";
import { ChannelTab, ChannelTabPrimaryKey } from "../../entities";
import { TabService } from "../../provider";
import {
  ChannelTabParameters,
  ChannelParameters,
  CreateChannelTabBody,
  PaginationQueryParameters,
  UpdateChannelTabBody,
} from "../types";
import { FastifyReply, FastifyRequest } from "fastify";
import { ChannelExecutionContext } from "../../types";
import { plainToClass } from "class-transformer";
import { handleError } from "../../../../utils/handleError";
import { getChannelRooms } from "../../services/member/realtime";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceEventsPayload,
  ResourceGetResponse,
  ResourceListResponse,
  ResourceUpdateResponse,
} from "../../../types";
import { getTabsRealtimeRoom } from "../../services/tab/service";
import { localEventBus } from "../../../../core/platform/framework/pubsub";

export class ChannelTabCrudController
  implements
    CrudController<
      ResourceGetResponse<ChannelTab>,
      ResourceCreateResponse<ChannelTab>,
      ResourceListResponse<ChannelTab>,
      ResourceDeleteResponse
    > {
  constructor(protected service: TabService) {}

  getPrimaryKey(request: FastifyRequest<{ Params: ChannelTabParameters }>): ChannelTabPrimaryKey {
    return {
      id: request.params.tab_id,
      channel_id: request.params.id,
      company_id: request.params.company_id,
      workspace_id: request.params.workspace_id,
    };
  }

  async get(
    request: FastifyRequest<{ Params: ChannelTabParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<ChannelTab>> {
    const resource = await this.service.get(
      this.getPrimaryKey(request),
      getExecutionContext(request),
    );

    if (!resource) {
      reply.notFound(`Channel member ${request.params.tab_id} not found`);

      return;
    }

    return {
      resource,
    };
  }

  async save(
    request: FastifyRequest<{ Body: CreateChannelTabBody; Params: ChannelTabParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceCreateResponse<ChannelTab>> {
    const entity = plainToClass(ChannelTab, {
      ...request.body.resource,
      ...{
        company_id: request.params.company_id,
        workspace_id: request.params.workspace_id,
        channel_id: request.params.id,
      },
    });

    try {
      const result = await this.service.save(entity, {}, getExecutionContext(request));

      if (result.entity) {
        localEventBus.publish<ResourceEventsPayload>("channel:tab:created", {
          tab: result.entity,
          actor: getExecutionContext(request).user,
          resourcesAfter: [result.entity],
          channelParameters: request.params,
        });
        reply.code(201);
      }

      return {
        resource: result.entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async update(
    request: FastifyRequest<{ Body: UpdateChannelTabBody; Params: ChannelTabParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceUpdateResponse<ChannelTab>> {
    const entity = plainToClass(ChannelTab, {
      ...request.body.resource,
      ...this.getPrimaryKey(request),
    });

    try {
      const result = await this.service.save(entity, {}, getExecutionContext(request));

      if (result.entity) {
        reply.code(200);
      }

      return {
        resource: result.entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async delete(
    request: FastifyRequest<{ Params: ChannelTabParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    try {
      const deleteResult = await this.service.delete(
        this.getPrimaryKey(request),
        getExecutionContext(request),
      );

      if (deleteResult.deleted) {
        localEventBus.publish<ResourceEventsPayload>("channel:tab:deleted", {
          tab: deleteResult.entity,
          actor: getExecutionContext(request).user,
          resourcesAfter: [deleteResult.entity],
          channelParameters: request.params,
        });
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

  /**
   * List channel tabs
   *
   * @param request
   */
  async list(
    request: FastifyRequest<{
      Querystring: PaginationQueryParameters;
      Params: ChannelParameters;
    }>,
  ): Promise<ResourceListResponse<ChannelTab>> {
    const context = getExecutionContext(request);
    const list = await this.service.list(
      new Pagination(request.query.page_token, request.query.limit),
      {},
      context,
    );

    return {
      ...{
        resources: list.getEntities(),
      },
      ...(request.query.websockets && {
        websockets: [{ room: getTabsRealtimeRoom(context.channel) }],
      }),
      ...(list.page_token && {
        next_page_token: list.page_token,
      }),
    };
  }
}

function getExecutionContext(
  request: FastifyRequest<{ Params: ChannelParameters }>,
): ChannelExecutionContext {
  return {
    user: request.currentUser,
    url: request.url,
    method: request.routerMethod,
    transport: "http",
    channel: {
      id: request.params.id,
      company_id: request.params.company_id,
      workspace_id: request.params.workspace_id,
    },
  };
}
