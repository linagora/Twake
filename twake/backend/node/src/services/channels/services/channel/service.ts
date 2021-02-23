import { cloneDeep, find } from "lodash";
import { diff } from "deep-object-diff";
import {
  RealtimeSaved,
  RealtimeUpdated,
  RealtimeDeleted,
} from "../../../../core/platform/framework";
import {
  UpdateResult,
  DeleteResult,
  Pagination,
  ListResult,
  SaveResult,
  OperationType,
  CrudExeption,
} from "../../../../core/platform/framework/api/crud-service";
import ChannelServiceAPI, { ChannelPrimaryKey } from "../../provider";
import { logger } from "../../../../core/platform/framework";

import { Channel, ChannelMember, UserChannel, UserDirectChannel } from "../../entities";
import { getChannelPath, getRoomName } from "./realtime";
import {
  ChannelType,
  ChannelVisibility,
  WorkspaceExecutionContext,
  ChannelSystemExecutionContext,
} from "../../types";
import { isWorkspaceAdmin as userIsWorkspaceAdmin } from "../../../../utils/workspace";
import { ResourceEventsPayload, User } from "../../../types";
import { pick } from "../../../../utils/pick";
import { ChannelService } from "../../provider";
import { DirectChannel } from "../../entities/direct-channel";
import { ChannelListOptions, ChannelSaveOptions } from "../../web/types";
import { isDirectChannel } from "../../utils";
import { ResourcePath } from "../../../../core/platform/services/realtime/types";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { ChannelActivity } from "../../entities/channel-activity";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import {
  PubsubPublish,
  PubsubParameter,
} from "../../../../core/platform/services/pubsub/decorators/publish";
import _ from "lodash";
import { localEventBus } from "../../../../core/platform/framework/pubsub";

export class Service implements ChannelService {
  version: "1";
  activityRepository: Repository<ChannelActivity>;

  constructor(
    private service: ChannelService,
    private channelService: ChannelServiceAPI,
    private database: DatabaseServiceAPI,
  ) {}

  async init(): Promise<this> {
    this.activityRepository = await this.database.getRepository(
      "channel_activity",
      ChannelActivity,
    );

    try {
      this.service.init && (await this.service.init());
    } catch (err) {
      console.error("Can not initialize database service", err);
    }

    return this;
  }

  @RealtimeSaved<Channel>((channel, context) => [
    {
      room: ResourcePath.get(getRoomName(channel, context as WorkspaceExecutionContext)),
      path: getChannelPath(channel, context as WorkspaceExecutionContext),
    },
  ])
  async save(
    channel: Channel,
    options: ChannelSaveOptions,
    context: WorkspaceExecutionContext,
  ): Promise<SaveResult<Channel>> {
    let channelToUpdate: Channel;
    let channelToSave: Channel;
    const mode = channel.id ? OperationType.UPDATE : OperationType.CREATE;
    const isWorkspaceAdmin = userIsWorkspaceAdmin(context.user, context.workspace);
    const isDirectChannel = Channel.isDirectChannel(channel);

    if (isDirectChannel) {
      channel.visibility = ChannelVisibility.DIRECT;
      channel.workspace_id = ChannelVisibility.DIRECT;
    }

    if (mode === OperationType.UPDATE) {
      logger.debug("Updating channel");
      channelToUpdate = await this.get(this.getPrimaryKey(channel), context);

      if (!channelToUpdate) {
        throw CrudExeption.notFound("Channel not found");
      }

      const isChannelOwner = this.isChannelOwner(channelToUpdate, context.user);
      const updatableParameters: Partial<Record<keyof Channel, boolean>> = {
        name: !isDirectChannel,
        description: true,
        icon: true,
        channel_group: true,
        is_default: (isWorkspaceAdmin || isChannelOwner) && !isDirectChannel,
        visibility: (isWorkspaceAdmin || isChannelOwner) && !isDirectChannel,
        archived: isWorkspaceAdmin || isChannelOwner,
        connectors: !isDirectChannel,
      };

      // Diff existing channel and input one, cleanup all the undefined fields for all objects
      const channelDiff = diff(channelToUpdate, channel);
      const fields = Object.keys(channelDiff) as Array<Partial<keyof Channel>>;

      if (!fields.length) {
        throw CrudExeption.badRequest("Nothing to update");
      }

      const updatableFields = fields.filter(field => updatableParameters[field]);

      if (!updatableFields.length) {
        throw CrudExeption.badRequest("Current user can not update requested fields");
      }

      channelToSave = cloneDeep(channelToUpdate);

      updatableFields.forEach(field => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (channelToSave as any)[field] = channel[field];
      });

      localEventBus.publish<ResourceEventsPayload>("channel:updated", {
        actor: context.user,
        resourcesBefore: [channelToUpdate],
        resourcesAfter: [channel],
        channel: channel,
      });
    }

    if (mode === OperationType.CREATE) {
      if (isDirectChannel) {
        options.members = Array.from(new Set<string>(options?.members || []).add(context.user.id));
        channel.members = options.members;

        logger.info("Direct channel creation with members %o", options.members);
        if (context.workspace.workspace_id !== ChannelVisibility.DIRECT) {
          throw CrudExeption.badRequest("Direct Channel creation error: bad workspace");
        }

        const directChannel = await this.getDirectChannelInCompany(
          context.workspace.company_id,
          options.members,
        );

        if (directChannel) {
          logger.debug("Direct channel already exists %o", directChannel);
          const existingChannel = await this.service.get(
            {
              company_id: context.workspace.company_id,
              id: directChannel.channel_id,
              workspace_id: ChannelType.DIRECT,
            },
            context,
          );
          if (existingChannel) {
            return new SaveResult<Channel>("channels", existingChannel, OperationType.EXISTS);
          } else {
            //Fixme: remove directChannel instance
            throw CrudExeption.badRequest("table inconsistency");
          }
        }
      } else {
        if (!channel.name) {
          throw CrudExeption.badRequest("'name' is required");
        }
      }

      channelToSave = channel;
    }

    logger.info("Creating channel %o", channelToSave);
    const saveResult = await this.service.save(channelToSave, options, context);

    await this.onSaved(channelToSave, options, context, saveResult, mode);

    return saveResult;
  }

  get(pk: ChannelPrimaryKey, context: WorkspaceExecutionContext): Promise<Channel> {
    return this.service.get(pk, context);
  }

  @RealtimeUpdated<Channel>((channel, context) => [
    {
      room: ResourcePath.get(getRoomName(channel, context as WorkspaceExecutionContext)),
      path: getChannelPath(channel, context as WorkspaceExecutionContext),
    },
  ])
  update(
    pk: ChannelPrimaryKey,
    channel: Channel,
    context: WorkspaceExecutionContext,
  ): Promise<UpdateResult<Channel>> {
    return this.service.update(pk, channel, context);
  }

  @RealtimeDeleted<Channel>((channel, context) => [
    {
      room: ResourcePath.get(getRoomName(channel, context as WorkspaceExecutionContext)),
      path: getChannelPath(channel, context as WorkspaceExecutionContext),
    },
  ])
  async delete(
    pk: ChannelPrimaryKey,
    context: WorkspaceExecutionContext,
  ): Promise<DeleteResult<Channel>> {
    const channelToDelete = await this.service.get(this.getPrimaryKey(pk), context);

    if (!channelToDelete) {
      throw new CrudExeption("Channel not found", 404);
    }

    if (isDirectChannel(channelToDelete)) {
      throw new CrudExeption("Direct channel can not be deleted", 400);
    }

    const isWorkspaceAdmin = userIsWorkspaceAdmin(context.user, context.workspace);
    const isChannelOwner = this.isChannelOwner(channelToDelete, context.user);

    if (!isWorkspaceAdmin && !isChannelOwner) {
      throw new CrudExeption("Channel can not be deleted", 400);
    }

    const result = await this.service.delete(pk, context);

    this.onDeleted(channelToDelete, result);

    return result;
  }

  @RealtimeUpdated<ChannelActivity>((channelActivity, context) => {
    return [
      {
        room: ResourcePath.get(
          getRoomName(channelActivity.getChannelPrimaryKey(), context as WorkspaceExecutionContext),
        ),
        path: getChannelPath(
          channelActivity.getChannelPrimaryKey(),
          context as WorkspaceExecutionContext,
        ),
        resource: {
          company_id: channelActivity.company_id,
          workspace_id: channelActivity.workspace_id,
          id: channelActivity.channel_id,
          last_activity: channelActivity.last_activity,
        },
      },
    ];
  })
  async updateLastActivity(
    options: ChannelPrimaryKey,
    context: ChannelSystemExecutionContext,
  ): Promise<UpdateResult<ChannelActivity>> {
    const channel = await this.service.get(
      options,
      _.pick(context, "workspace") as WorkspaceExecutionContext,
    );

    const entity = new ChannelActivity();
    entity.channel_id = options.id;
    entity.company_id = options.company_id;
    entity.workspace_id = options.workspace_id;
    entity.last_activity = new Date().getTime();

    entity.channel = channel;

    logger.info(`Update activity for channel ${entity.channel_id} to ${entity.last_activity}`);

    await this.activityRepository.save(entity);
    return new UpdateResult<ChannelActivity>("channel_activity", entity);
  }

  async list(
    pagination: Pagination,
    options: ChannelListOptions,
    context: WorkspaceExecutionContext,
  ): Promise<ListResult<Channel | UserChannel | UserDirectChannel>> {
    const isDirectWorkspace = isDirectChannel(context.workspace);
    const isWorkspaceAdmin = userIsWorkspaceAdmin(context.user, context.workspace);

    if (options?.mine || isDirectWorkspace) {
      const userChannels = await this.channelService.members.listUserChannels(
        context.user,
        pagination,
        context,
      );

      options.channels = userChannels.getEntities().map(channelMember => channelMember.channel_id);

      const result = await this.service.list(pagination, options, context);

      const activityPerChannel: { [channelId: string]: ChannelActivity } = {};
      await Promise.all(
        result.getEntities().map(async channel => {
          activityPerChannel[channel.id] = await this.activityRepository.findOne({
            channel_id: channel.id,
            company_id: channel.company_id,
            workspace_id: channel.workspace_id,
          });
        }),
      );

      result.mapEntities(<UserChannel>(channel: Channel) => {
        const userChannel = find(userChannels.getEntities(), { channel_id: channel.id });

        return ({
          ...channel,
          ...{ user_member: userChannel },
          last_activity: activityPerChannel[channel.id]?.last_activity || 0,
        } as unknown) as UserChannel;
      });

      if (isDirectWorkspace) {
        result.mapEntities(<UserDirectChannel>(channel: UserChannel) => {
          return ({
            ...channel,
            ...{
              direct_channel_members: channel.members || [],
            },
          } as unknown) as UserDirectChannel;
        });
      }

      localEventBus.publish<ResourceEventsPayload>("channel:list", {
        user: context.user,
      });

      return result;
    }

    const result = await this.service.list(pagination, options, context);

    result.filterEntities(channel => channel.visibility !== ChannelVisibility.DIRECT);

    if (!isWorkspaceAdmin) {
      result.filterEntities(channel => channel.visibility === ChannelVisibility.PUBLIC);
    }

    return result;
  }

  createDirectChannel(directChannel: DirectChannel): Promise<DirectChannel> {
    return this.service.createDirectChannel(directChannel);
  }

  getDirectChannel(directChannel: DirectChannel): Promise<DirectChannel> {
    return this.service.getDirectChannel(directChannel);
  }

  getDirectChannelInCompany(companyId: string, users: string[]): Promise<DirectChannel> {
    return this.service.getDirectChannelInCompany(companyId, users);
  }

  getDirectChannelsForUsersInCompany(companyId: string, userId: string): Promise<DirectChannel[]> {
    return this.service.getDirectChannelsForUsersInCompany(companyId, userId);
  }

  async markAsRead(
    pk: ChannelPrimaryKey,
    user: User,
    context: WorkspaceExecutionContext,
  ): Promise<boolean> {
    const now = Date.now();
    const channel = await this.get(pk, context);

    if (!channel) {
      throw CrudExeption.notFound("Channel not found");
    }

    const member = await this.channelService.members.isChannelMember(user, channel);

    if (!member) {
      throw CrudExeption.badRequest("User is not channel member");
    }

    // Updating the member will also publish a message in the pubsub channel
    // This message will be handled in the notification service and will update the notification preferences for the member
    // cf this.members.onUpdated
    member.last_access = now;
    const updatedMember = (
      await this.channelService.members.save(member, null, {
        channel,
        user,
      })
    ).entity;

    this.onRead(channel, updatedMember);

    return true;
  }

  async markAsUnread(
    pk: ChannelPrimaryKey,
    user: User,
    context: WorkspaceExecutionContext,
  ): Promise<boolean> {
    const channel = await this.get(pk, context);

    if (!channel) {
      throw CrudExeption.notFound("Channel not found");
    }

    const member = await this.channelService.members.isChannelMember(user, channel);

    if (!member) {
      throw CrudExeption.badRequest("User is not channel member");
    }

    // do nothing here but send a notification so that notification service is updated...
    this.onUnread(channel, member);

    return true;
  }

  getPrimaryKey(channelOrPrimaryKey: Channel | ChannelPrimaryKey): ChannelPrimaryKey {
    return pick(channelOrPrimaryKey, ...(["company_id", "workspace_id", "id"] as const));
  }

  isChannelOwner(channel: Channel, user: User): boolean {
    return channel.owner && channel.owner === user.id;
  }

  /**
   * Called when channel update has been successfully called
   *
   * @param channel The channel before update has been processed
   * @param result The channel update result
   */
  async onSaved(
    channel: Channel,
    options: ChannelSaveOptions,
    context: WorkspaceExecutionContext,
    result: SaveResult<Channel>,
    mode: OperationType.CREATE | OperationType.UPDATE,
  ): Promise<void> {
    const savedChannel = result.entity;

    if (mode === OperationType.CREATE) {
      if (isDirectChannel(channel)) {
        const directChannel = {
          channel_id: savedChannel.id,
          company_id: savedChannel.company_id,
          users: DirectChannel.getUsersAsString(options.members),
        } as DirectChannel;

        await this.createDirectChannel(directChannel);
      }
    }

    const pushUpdates = {
      is_default: !!savedChannel.is_default && savedChannel.is_default !== channel.is_default,
      archived: !!savedChannel.archived && savedChannel.archived !== channel.archived,
    };

    localEventBus.publish<ResourceEventsPayload>("channel:created", { channel });
    logger.debug(`Channel ${mode}d`, pushUpdates);
  }

  /**
   * Called when channel delete has been successfully called
   *
   * @param channel The channel to delete
   * @param result The delete result
   */
  onDeleted(channel: Channel, result: DeleteResult<Channel>): void {
    logger.debug("Channel deleted", channel, result);
  }

  /**
   * Called when a channel as been marked as read.
   * Will publish `channel:read` notification in the pubsub service
   *
   * @param channel
   * @param member
   */
  @PubsubPublish("channel:read")
  onRead(
    @PubsubParameter("channel")
    channel: Channel,
    @PubsubParameter("member")
    member: ChannelMember,
  ): void {
    logger.info(`Channel ${channel.id} as been marked as read for user ${member.id}`);
  }

  /**
   * Called when a channel as been marked as unread.
   * Will publish `channel:unread` notification in the pubsub service
   *
   * @param channel
   * @param member
   */
  @PubsubPublish("channel:unread")
  onUnread(
    @PubsubParameter("channel")
    channel: Channel,
    @PubsubParameter("member")
    member: ChannelMember,
  ): void {
    logger.info(`Channel ${channel.id} as been marked as unread for user ${member.id}`);
  }
}
