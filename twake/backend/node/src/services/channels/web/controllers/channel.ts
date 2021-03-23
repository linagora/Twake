import { plainToClass } from "class-transformer";
import { FastifyReply, FastifyRequest } from "fastify";
import { Pagination } from "../../../../core/platform/framework/api/crud-service";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import { Channel, ChannelMember, UserChannel } from "../../entities";
import { ChannelService, ChannelPrimaryKey, MemberService } from "../../provider";
import { getWebsocketInformation, getWorkspaceRooms } from "../../services/channel/realtime";
import {
  BaseChannelsParameters,
  ChannelListQueryParameters,
  ChannelParameters,
  ChannelSaveOptions,
  CreateChannelBody,
  ReadChannelBody,
  UpdateChannelBody,
} from "../types";
import { ChannelExecutionContext, WorkspaceExecutionContext } from "../../types";
import { handleError } from "../../../../utils/handleError";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
  ResourceUpdateResponse,
} from "../../../../services/types";
import { getLogger } from "../../../../core/platform/framework/logger";
import _ from "lodash";

const logger = getLogger("channel.controller");

export class ChannelCrudController
  implements
    CrudController<
      ResourceGetResponse<Channel>,
      ResourceCreateResponse<Channel>,
      ResourceListResponse<Channel>,
      ResourceDeleteResponse
    > {
  constructor(protected service: ChannelService, protected membersService: MemberService) {}

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
  ): Promise<ResourceGetResponse<Channel>> {
    const channel = await this.service.get(
      this.getPrimaryKey(request),
      getExecutionContext(request),
    );

    if (!channel) {
      reply.notFound(`Channel ${request.params.id} not found`);

      return;
    }

    if (Channel.isDirectChannel(channel) || Channel.isPrivateChannel(channel)) {
      const isMember = await this.membersService.isChannelMember(request.currentUser, channel);

      if (!isMember) {
        reply.badRequest("User does not have enough rights to get channel");

        return;
      }
    }

    return {
      websocket: getWebsocketInformation(channel),
      resource: channel,
    };
  }

  async getForPHP(
    request: FastifyRequest<{ Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<void> {
    const channel = await this.service.get(
      this.getPrimaryKey(request),
      getExecutionContext(request),
    );

    reply.send(channel);
  }

  async save(
    request: FastifyRequest<{ Body: CreateChannelBody; Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceCreateResponse<Channel>> {
    const entity = plainToClass(Channel, {
      ...request.body.resource,
      ...{
        company_id: request.params.company_id,
        workspace_id: request.params.workspace_id,
      },
    });
    logger.debug("reqId: %s - save - Channel input %o", request.id, entity);

    try {
      const options = {
        members: request.body.options ? request.body.options.members || [] : [],
        addCreatorAsMember: true,
      } as ChannelSaveOptions;

      const context = getExecutionContext(request);
      const channelResult = await this.service.save(entity, options, context);

      logger.debug("reqId: %s - save - Channel %s created", request.id, channelResult.entity.id);

      const member = await this.membersService.save(
        _.assign(new ChannelMember(), {
          channel_id: channelResult.entity.id,
          workspace_id: channelResult.entity.workspace_id,
          company_id: channelResult.entity.company_id,
          user_id: context.user.id,
        }),
        {},
        getChannelExecutionContext(request, channelResult.entity),
      );

      const resultEntity = ({
        ...channelResult.entity,
        ...{ user_member: member },
      } as unknown) as UserChannel;

      if (channelResult.entity) {
        reply.code(201);
      }

      return {
        websocket: getWebsocketInformation(channelResult.entity),
        resource: resultEntity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async update(
    request: FastifyRequest<{ Body: UpdateChannelBody; Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceUpdateResponse<Channel>> {
    const entity = plainToClass(Channel, {
      ...request.body.resource,
      ...{
        company_id: request.params.company_id,
        workspace_id: request.params.workspace_id,
        id: request.params.id,
      },
    });

    try {
      const result = await this.service.save(entity, {}, getExecutionContext(request));

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
  ): Promise<ResourceListResponse<Channel>> {
    const list = await this.service.list(
      new Pagination(request.query.page_token, request.query.limit),
      { ...request.query },
      getExecutionContext(request),
    );

    return {
      ...{
        resources: list.getEntities(),
      },
      ...(request.query.websockets && {
        websockets: getWorkspaceRooms(request.params, request.currentUser),
      }),
      ...(list.page_token && {
        next_page_token: list.page_token,
      }),
    };
  }

  async delete(
    request: FastifyRequest<{ Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
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

  async updateRead(
    request: FastifyRequest<{ Body: ReadChannelBody; Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<boolean> {
    const read = request.body.value;

    try {
      const result = read
        ? await this.service.markAsRead(
            this.getPrimaryKey(request),
            request.currentUser,
            getExecutionContext(request),
          )
        : await this.service.markAsUnread(
            this.getPrimaryKey(request),
            request.currentUser,
            getExecutionContext(request),
          );
      return result;
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
    reqId: request.id,
    transport: "http",
    workspace: {
      company_id: request.params.company_id,
      workspace_id: request.params.workspace_id,
    },
  };
}

function getChannelExecutionContext(
  request: FastifyRequest<{ Params: ChannelParameters }>,
  channel: Channel,
): ChannelExecutionContext {
  return {
    user: request.currentUser,
    url: request.url,
    method: request.routerMethod,
    reqId: request.id,
    transport: "http",
    channel: {
      id: channel.id,
      company_id: channel.company_id,
      workspace_id: channel.workspace_id,
    },
  };
}
