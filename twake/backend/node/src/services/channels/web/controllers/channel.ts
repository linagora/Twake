import { plainToClass } from "class-transformer";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateResult,
  CrudException,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import {
  Channel,
  ChannelMember,
  ChannelPendingEmails,
  ChannelPendingEmailsPrimaryKey,
  getChannelPendingEmailsInstance,
  UserChannel,
} from "../../entities";
import {
  ChannelPendingEmailService,
  ChannelPrimaryKey,
  ChannelService,
  MemberService,
} from "../../provider";
import { getWebsocketInformation, getWorkspaceRooms } from "../../services/channel/realtime";
import {
  BaseChannelsParameters,
  ChannelListQueryParameters,
  ChannelParameters,
  ChannelPendingEmailsDeleteQueryParameters,
  ChannelSaveOptions,
  CreateChannelBody,
  ReadChannelBody,
  UpdateChannelBody,
} from "../types";
import { ChannelExecutionContext, ChannelVisibility, WorkspaceExecutionContext } from "../../types";
import { handleError } from "../../../../utils/handleError";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
  ResourceUpdateResponse,
} from "../../../../utils/types";
import { RealtimeServiceAPI } from "../../../../core/platform/services/realtime/api";
import { getLogger } from "../../../../core/platform/framework/logger";
import _ from "lodash";
import { ChannelMemberObject, ChannelObject } from "../../services/channel/types";
import { ChannelUserCounterType } from "../../entities/channel-counters";

const logger = getLogger("channel.controller");

export class ChannelCrudController
  implements
    CrudController<
      ResourceGetResponse<ChannelObject>,
      ResourceCreateResponse<ChannelObject>,
      ResourceListResponse<ChannelObject>,
      ResourceDeleteResponse
    >
{
  constructor(
    protected websockets: RealtimeServiceAPI,
    protected service: ChannelService,
    protected membersService: MemberService,
    protected pendingEmails: ChannelPendingEmailService,
  ) {}

  getPrimaryKey(request: FastifyRequest<{ Params: ChannelParameters }>): ChannelPrimaryKey {
    return {
      id: request.params.id,
      company_id: request.params.company_id,
      workspace_id: request.params.workspace_id,
    };
  }

  async get(
    request: FastifyRequest<{ Querystring: ChannelListQueryParameters; Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<ChannelObject>> {
    const context = getExecutionContext(request);

    let channel = await this.service.get(this.getPrimaryKey(request), getExecutionContext(request));

    if (!channel) {
      throw CrudException.notFound(`Channel ${request.params.id} not found`);
    }

    if (Channel.isDirectChannel(channel) || Channel.isPrivateChannel(channel)) {
      const isMember = await this.membersService.isChannelMember(request.currentUser, channel);

      if (!isMember) {
        throw CrudException.badRequest("User does not have enough rights to get channel");
      }
    }

    if (request.query.include_users)
      channel = await this.service.includeUsersInDirectChannel(
        channel,
        getExecutionContext(request),
      );

    const member = await this.membersService.get(
      _.assign(new ChannelMember(), {
        channel_id: channel.id,
        workspace_id: channel.workspace_id,
        company_id: channel.company_id,
        user_id: context.user.id,
      }),
      getChannelExecutionContext(request, channel),
    );

    const channelObject = ChannelObject.mapTo(channel, {
      user_member: ChannelMemberObject.mapTo(member),
    });

    await this.completeWithStatistics([channelObject]);

    return {
      websocket: this.websockets.sign([getWebsocketInformation(channel)], context.user.id)[0],
      resource: channelObject,
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
    request: FastifyRequest<{
      Body: CreateChannelBody;
      Params: ChannelParameters;
      Querystring: { include_users: boolean };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceCreateResponse<ChannelObject>> {
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

      await this.membersService.addUsersToChannel(
        options.members.map(userId => {
          return { id: userId };
        }),
        channelResult.entity,
      );

      logger.debug("reqId: %s - save - Channel %s created", request.id, channelResult.entity.id);

      const member = await this.membersService.get(
        _.assign(new ChannelMember(), {
          channel_id: channelResult.entity.id,
          workspace_id: channelResult.entity.workspace_id,
          company_id: channelResult.entity.company_id,
          user_id: context.user.id,
        }),
        getChannelExecutionContext(request, channelResult.entity),
      );

      let entityWithUsers: Channel = channelResult.entity;

      if (request.query.include_users)
        entityWithUsers = await this.service.includeUsersInDirectChannel(entityWithUsers, context);

      const resultEntity = {
        ...entityWithUsers,
        ...{ user_member: member },
      } as unknown as UserChannel;

      if (entity) {
        reply.code(201);
      }

      return {
        websocket: this.websockets.sign(
          [getWebsocketInformation(channelResult.entity)],
          context.user.id,
        )[0],
        resource: ChannelObject.mapTo(resultEntity),
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async update(
    request: FastifyRequest<{ Body: UpdateChannelBody; Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceUpdateResponse<ChannelObject>> {
    const entity = plainToClass(Channel, {
      ...request.body.resource,
      ...{
        company_id: request.params.company_id,
        workspace_id: request.params.workspace_id,
        id: request.params.id,
      },
    });

    try {
      const context = getExecutionContext(request);
      const result = await this.service.save(entity, {}, context);

      if (result.entity) {
        reply.code(201);
      }

      return {
        websocket: this.websockets.sign(
          [getWebsocketInformation(result.entity)],
          context.user.id,
        )[0],
        resource: ChannelObject.mapTo(result.entity),
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
  ): Promise<ResourceListResponse<ChannelObject>> {
    const context = getExecutionContext(request);

    //Fixme: this slow down the channel get operation. Once we stabilize the workspace:member:added event we can remove this
    if (context.workspace.workspace_id !== ChannelVisibility.DIRECT) {
      await this.pendingEmails.proccessPendingEmails(
        {
          user_id: context.user.id,
          ...context.workspace,
        },
        context.workspace,
      );
    }

    const list = await this.service.list(
      new Pagination(request.query.page_token, request.query.limit),
      { ...request.query },
      context,
    );

    let entities = [];
    if (request.query.include_users) {
      entities = [];
      for (const e of list.getEntities()) {
        entities.push(await this.service.includeUsersInDirectChannel(e, context));
      }
    } else {
      entities = list.getEntities();
    }

    const resources = entities.map(a => ChannelObject.mapTo(a));

    await this.completeWithStatistics(resources);

    return {
      ...{
        resources: resources,
      },
      ...(request.query.websockets && {
        websockets: this.websockets.sign(
          getWorkspaceRooms(request.params, request.currentUser),
          request.currentUser.id,
        ),
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

  async findPendingEmails(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: FastifyRequest<{
      Querystring: ChannelListQueryParameters;
      Params: ChannelPendingEmailsPrimaryKey;
    }>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reply: FastifyReply,
  ): Promise<ResourceListResponse<ChannelPendingEmails>> {
    const list = await this.pendingEmails.list(
      new Pagination(request.query.page_token, request.query.limit),
      { ...request.query },
      getChannelPendingEmailsExecutionContext(request),
    );

    return {
      resources: list.getEntities(),
      ...(request.query.websockets && {
        websockets: this.websockets.sign(
          getWorkspaceRooms(request.params, request.currentUser),
          request.currentUser.id,
        ),
      }),
      ...(list.page_token && {
        next_page_token: list.page_token,
      }),
    };
  }

  async savePendingEmails(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: FastifyRequest<{
      Body: { resource: ChannelPendingEmails };
      Params: ChannelPendingEmailsPrimaryKey;
    }>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reply: FastifyReply,
  ): Promise<ResourceCreateResponse<CreateResult<ChannelPendingEmails>>> {
    const pendingEmail = await this.pendingEmails.create(
      getChannelPendingEmailsInstance(request.body.resource),
      getChannelPendingEmailsExecutionContext(request),
    );
    logger.debug("reqId: %s - save - PendingEmails input %o", request.id, pendingEmail.entity);
    return { resource: pendingEmail };
  }

  async deletePendingEmails(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: FastifyRequest<{ Params: ChannelPendingEmailsDeleteQueryParameters }>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    const pendingEmail = await this.pendingEmails.delete(
      getChannelPendingEmailsInstance({
        channel_id: request.params.channel_id,
        company_id: request.params.company_id,
        workspace_id: request.params.workspace_id,
        email: request.params.email,
      }),
      getChannelPendingEmailsExecutionContext(request),
    );

    return { status: pendingEmail.deleted ? "success" : "error" };
  }

  async completeWithStatistics(channels: ChannelObject[]) {
    await Promise.all(
      channels.map(async a => {
        const members = await this.membersService.getUsersCount({
          ..._.pick(a, "id", "company_id", "workspace_id"),
          counter_type: ChannelUserCounterType.MEMBERS,
        });
        //Fixme: even if it works strange to use "getUsersCount" to get messages count
        const messages = await this.membersService.getUsersCount({
          ..._.pick(a, "id", "company_id", "workspace_id"),
          counter_type: ChannelUserCounterType.MESSAGES,
        });
        a.stats = { members, messages };
      }),
    );
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

function getChannelPendingEmailsExecutionContext(
  request: FastifyRequest<{
    Params: ChannelPendingEmailsPrimaryKey | ChannelPendingEmailsDeleteQueryParameters;
  }>,
): ChannelExecutionContext {
  return {
    user: request.currentUser,
    url: request.url,
    method: request.routerMethod,
    reqId: request.id,
    transport: "http",
    channel: {
      id: request.params.channel_id,
      company_id: request.params.company_id,
      workspace_id: request.params.workspace_id,
    },
  };
}
