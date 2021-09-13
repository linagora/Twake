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
import ChannelServiceAPI, {
  ChannelActivityMessage,
  ChannelPrimaryKey,
  DefaultChannelService,
} from "../../provider";
import { getLogger } from "../../../../core/platform/framework";
import { ChannelObject } from "./types";
import {
  Channel,
  ChannelMember,
  DefaultChannel,
  UserChannel,
  UsersIncludedChannel,
} from "../../entities";
import { getChannelPath, getRoomName } from "./realtime";
import { ChannelType, ChannelVisibility, WorkspaceExecutionContext } from "../../types";
import { isWorkspaceAdmin as userIsWorkspaceAdmin } from "../../../../utils/workspace";
import { ResourceEventsPayload, User } from "../../../../utils/types";
import { pick } from "../../../../utils/pick";
import { ChannelService } from "../../provider";
import {
  DirectChannel,
  getInstance as getDirectChannelInstance,
} from "../../entities/direct-channel";
import { ChannelListOptions, ChannelSaveOptions } from "../../web/types";
import { isDirectChannel } from "../../utils";
import { ResourcePath } from "../../../../core/platform/services/realtime/types";
import Repository, {
  FindFilter,
} from "../../../../core/platform/services/database/services/orm/repository/repository";
import { ChannelActivity } from "../../entities/channel-activity";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import {
  PubsubPublish,
  PubsubParameter,
} from "../../../../core/platform/services/pubsub/decorators/publish";
import { localEventBus } from "../../../../core/platform/framework/pubsub";
import DefaultChannelServiceImpl from "./default/service";
import UserServiceAPI from "../../../user/api";
import _ from "lodash";

const logger = getLogger("channel.service");

export class Service implements ChannelService {
  version: "1";
  activityRepository: Repository<ChannelActivity>;
  channelRepository: Repository<Channel>;
  directChannelRepository: Repository<DirectChannel>;
  defaultChannelService: DefaultChannelService;

  constructor(
    private channelService: ChannelServiceAPI,
    private database: DatabaseServiceAPI,
    private userService: UserServiceAPI,
  ) {}

  async init(): Promise<this> {
    this.defaultChannelService = new DefaultChannelServiceImpl(
      this.database,
      this.channelService,
      this.userService,
    );

    try {
      this.activityRepository = await this.database.getRepository(
        "channel_activity",
        ChannelActivity,
      );
      this.channelRepository = await this.database.getRepository("channels", Channel);
      this.directChannelRepository = await this.database.getRepository(
        "direct_channels",
        DirectChannel,
      );
    } catch (err) {
      logger.error({ err }, "Can not initialize channel db service");
    }

    try {
      await this.defaultChannelService.init();
    } catch (err) {
      logger.warn("Can not initialize default channel service", err);
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
  ): Promise<SaveResult<ChannelObject>> {
    let channelToUpdate: Channel;
    let channelToSave: Channel;
    const mode = channel.id ? OperationType.UPDATE : OperationType.CREATE;
    const isDirectChannel = Channel.isDirectChannel(channel);
    const isWorkspaceAdmin =
      !isDirectChannel &&
      (await userIsWorkspaceAdmin(this.userService, context.user, context.workspace));
    const isPrivateChannel = Channel.isPrivateChannel(channel);
    const isDefaultChannel = Channel.isDefaultChannel(channel);

    channel.workspace_id = context.workspace.workspace_id || channel.workspace_id;
    channel.company_id = context.workspace.company_id || channel.company_id;

    if (isDirectChannel) {
      channel.visibility = ChannelVisibility.DIRECT;
      channel.workspace_id = ChannelVisibility.DIRECT;
    }

    if (mode === OperationType.UPDATE) {
      logger.debug("Updating channel");
      channelToUpdate = await this.get(this.getPrimaryKey(channel));

      if (!channelToUpdate) {
        throw CrudExeption.notFound("Channel not found");
      }

      const isChannelOwner = this.isChannelOwner(channelToUpdate, context.user);
      const updatableParameters: Partial<Record<keyof Channel, boolean>> = {
        name: true,
        description: !isDirectChannel,
        icon: !isDirectChannel,
        channel_group: !isDirectChannel,
        is_default: (isWorkspaceAdmin || isChannelOwner) && !isDirectChannel && !isPrivateChannel,
        visibility: !isDirectChannel && (isWorkspaceAdmin || isChannelOwner),
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
        user: context.user,
      });
    }

    if (mode === OperationType.CREATE) {
      if (isPrivateChannel && isDefaultChannel) {
        throw CrudExeption.badRequest("Private channel can not be default");
      }

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
          const existingChannel = await this.channelRepository.findOne({
            company_id: context.workspace.company_id,
            workspace_id: ChannelType.DIRECT,
            id: directChannel.channel_id,
          });
          if (existingChannel) {
            const last_activity = await this.getChannelActivity(existingChannel);

            const saveResult = new SaveResult(
              "channels",
              ChannelObject.mapTo(existingChannel, { last_activity }),
              OperationType.EXISTS,
            );
            await this.addContextUserToChannel(context, saveResult);

            return saveResult;
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
      channelToSave.owner = context.user.id;
    }

    logger.info("Saving channel %o", channelToSave);
    await this.channelRepository.save(channelToSave);
    const saveResult = new SaveResult<ChannelObject>(
      "channel",
      ChannelObject.mapTo(channelToSave),
      mode,
    );

    await this.addContextUserToChannel(context, saveResult);
    await this.onSaved(channelToSave, options, context, saveResult, mode);

    return saveResult;
  }

  async get(pk: ChannelPrimaryKey): Promise<ChannelObject> {
    const primaryKey = this.getPrimaryKey(pk);
    const channel = await this.channelRepository.findOne(primaryKey);
    const last_activity = await this.getChannelActivity(channel);

    return ChannelObject.mapTo(channel, { last_activity });
  }

  @RealtimeUpdated<Channel>((channel, context) => [
    {
      room: ResourcePath.get(getRoomName(channel, context as WorkspaceExecutionContext)),
      path: getChannelPath(channel, context as WorkspaceExecutionContext),
    },
  ])
  async update(pk: ChannelPrimaryKey, channel: Channel): Promise<UpdateResult<ChannelObject>> {
    // TODO: Do the update by hand then save
    if (!pk.id) {
      throw CrudExeption.badRequest("Channel id is required for update");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mergeChannel: any = { ...channel, ...pk };
    await this.channelRepository.save(mergeChannel as Channel);

    return new UpdateResult<ChannelObject>("channel", ChannelObject.mapTo(mergeChannel));
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
  ): Promise<DeleteResult<ChannelObject>> {
    const channelToDelete = await this.channelRepository.findOne(this.getPrimaryKey(pk));

    if (!channelToDelete) {
      throw new CrudExeption("Channel not found", 404);
    }

    const directChannel = isDirectChannel(channelToDelete);

    if (directChannel) {
      throw new CrudExeption("Direct channel can not be deleted", 400);
    }

    const isWorkspaceAdmin =
      !directChannel &&
      (await userIsWorkspaceAdmin(this.userService, context.user, context.workspace));
    const isChannelOwner = this.isChannelOwner(channelToDelete, context.user);

    if (!isWorkspaceAdmin && !isChannelOwner) {
      throw new CrudExeption("Channel can not be deleted", 400);
    }

    await this.channelRepository.remove(channelToDelete);
    const result = new DeleteResult("channel", ChannelObject.mapTo(pk as Channel), true);

    this.onDeleted(channelToDelete, result);

    localEventBus.publish<ResourceEventsPayload>("channel:deleted", {
      channel: channelToDelete,
      user: context.user,
    });

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
          last_message: channelActivity.last_message,
        },
      },
    ];
  })
  async updateLastActivity(
    payload: {
      date: number;
      channel: ChannelPrimaryKey;
      message: ChannelActivityMessage | null;
    },
    context: WorkspaceExecutionContext,
  ): Promise<UpdateResult<ChannelActivity>> {
    const channelPK = payload.channel;
    const channelActivityMessage = payload.message;
    const channel = await this.channelRepository.findOne(
      _.pick(channelPK, "company_id", "workspace_id", "id"),
    );
    const entity = new ChannelActivity();
    entity.channel_id = channelPK.id;
    entity.company_id = channelPK.company_id;
    entity.workspace_id = channelPK.workspace_id;
    entity.last_activity = payload.date;
    entity.last_message = channelActivityMessage
      ? {
          date: channelActivityMessage.date,
          sender: channelActivityMessage.sender,
          sender_name: channelActivityMessage.sender_name,
          title: channelActivityMessage.title,
          text: channelActivityMessage.text,
        }
      : null;

    entity.channel = channel;

    logger.info(`Update activity for channel ${entity.channel_id} to ${entity.last_activity}`);

    await this.activityRepository.save(entity);
    return new UpdateResult<ChannelActivity>("channel_activity", entity);
  }

  private async getChannelActivity(channel: Channel): Promise<number> {
    let result = 0;

    if (!channel) {
      return result;
    }

    try {
      const activity = await this.activityRepository.findOne({
        company_id: channel.company_id,
        workspace_id: channel.workspace_id,
        channel_id: channel.id,
      } as ChannelActivity);

      result = activity?.last_activity || 0;
    } catch (error) {
      logger.debug(`Can not get channel last activity for channel ${channel.id}`);
    }
    return result;
  }

  async list(
    pagination: Pagination,
    options: ChannelListOptions,
    context: WorkspaceExecutionContext,
  ): Promise<ListResult<Channel | UserChannel>> {
    let channels: ListResult<Channel | UserChannel>;
    let activityPerChannel: Map<string, ChannelActivity>;
    const isDirectWorkspace = isDirectChannel(context.workspace);
    const isWorkspaceAdmin =
      !isDirectWorkspace && userIsWorkspaceAdmin(this.userService, context.user, context.workspace);
    const findFilters: FindFilter = {
      company_id: context.workspace.company_id,
      workspace_id: context.workspace.workspace_id,
    };

    if (options?.mine || isDirectWorkspace) {
      const userChannels = await this.channelService.members.listUserChannels(
        context.user,
        pagination,
        context,
      );

      channels = await this.channelRepository.find(findFilters, {
        $in: [["id", userChannels.getEntities().map(channelMember => channelMember.channel_id)]],
      });

      if (!channels.isEmpty()) {
        const activities = await this.activityRepository.find(findFilters, {
          $in: [["channel_id", channels.getEntities().map(channel => channel.id)]],
        });

        activityPerChannel = new Map<string, ChannelActivity>(
          activities.getEntities().map(activity => [activity.channel_id, activity]),
        );
      } else {
        activityPerChannel = new Map<string, ChannelActivity>();
      }

      channels.mapEntities(<UserChannel>(channel: Channel) => {
        const userChannel = find(userChannels.getEntities(), { channel_id: channel.id });

        const channelActivity = activityPerChannel.get(channel.id);

        return {
          ...channel,
          ...{ user_member: userChannel },
          last_activity: channelActivity?.last_activity || 0,
          last_message: channelActivity?.last_message || {},
        } as unknown as UserChannel;
      });

      if (isDirectWorkspace) {
        channels.mapEntities(<UserDirectChannel>(channel: UserChannel) => {
          return {
            ...channel,
            ...{
              members: channel.members || [],
            },
          } as unknown as UserDirectChannel;
        });
      }

      localEventBus.publish<ResourceEventsPayload>("channel:list", {
        user: context.user,
        company: {
          id: context.workspace.company_id,
        },
      });

      return new ListResult(channels.type, channels.getEntities(), userChannels.nextPage);
    }

    channels = await this.channelRepository.find(findFilters, { pagination });
    channels.filterEntities(channel => channel.visibility !== ChannelVisibility.DIRECT);

    if (!isWorkspaceAdmin && !context.user.server_request) {
      channels.filterEntities(channel => channel.visibility === ChannelVisibility.PUBLIC);
    }

    return channels;
  }

  async createDirectChannel(directChannel: DirectChannel): Promise<DirectChannel> {
    const instance = getDirectChannelInstance(directChannel);
    await this.directChannelRepository.save(instance);

    return instance;
  }

  getDirectChannel(directChannel: DirectChannel): Promise<DirectChannel> {
    return this.directChannelRepository.findOne(directChannel);
  }

  async getDirectChannelInCompany(companyId: string, users: string[]): Promise<DirectChannel> {
    const directChannel = await this.directChannelRepository.findOne({
      company_id: companyId,
      users: DirectChannel.getUsersAsString(users),
    });

    // TODO map
    return directChannel;
  }

  async getDirectChannelsInCompany(
    pagination: Pagination,
    company_id: string,
  ): Promise<ListResult<DirectChannel>> {
    return await this.directChannelRepository.find({ company_id }, { pagination });
  }

  async getDirectChannelsForUsersInCompany(
    companyId: string,
    userId: string,
  ): Promise<DirectChannel[]> {
    const list = await this.directChannelRepository.find(
      {
        company_id: companyId,
      },
      {
        $like: [["users", userId]],
      },
    );

    return list.getEntities();
  }

  async markAsRead(pk: ChannelPrimaryKey, user: User): Promise<boolean> {
    const now = Date.now();
    const channel = await this.get(pk);

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

  async markAsUnread(pk: ChannelPrimaryKey, user: User): Promise<boolean> {
    const channel = await this.get(pk);

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

  getDefaultChannels(
    workspace: Required<Pick<ChannelPrimaryKey, "company_id" | "workspace_id">>,
  ): Promise<DefaultChannel[]> {
    return this.defaultChannelService.getDefaultChannels(workspace);
  }

  async addUserToDefaultChannels(
    user: User,
    workspace: Required<Pick<ChannelPrimaryKey, "company_id" | "workspace_id">>,
  ): Promise<ChannelMember[]> {
    const result = await this.defaultChannelService.addUserToDefaultChannels(user, workspace);

    return result.filter(e => e.added).map(e => e.member);
  }

  getPrimaryKey(channelOrPrimaryKey: Channel | ChannelPrimaryKey): ChannelPrimaryKey {
    return pick(channelOrPrimaryKey, ...(["company_id", "workspace_id", "id"] as const));
  }

  isChannelOwner(channel: Channel, user: User): boolean {
    return channel.owner && String(channel.owner) === user.id;
  }

  async addContextUserToChannel(
    context: WorkspaceExecutionContext,
    result: SaveResult<Channel>,
  ): Promise<void> {
    const savedChannel = result.entity;

    //Add requester as member
    if (context.user.id) {
      try {
        await this.channelService.members.addUserToChannels({ id: context.user.id }, [
          savedChannel,
        ]);
      } catch (err) {
        logger.warn({ err }, "Can not add requester as channel member");
      }
    }
  }

  public async includeUsersInDirectChannel(
    channel: Channel,
    context?: WorkspaceExecutionContext,
  ): Promise<UsersIncludedChannel> {
    let channelWithUsers: UsersIncludedChannel = { users: [], ...channel };
    if (isDirectChannel(channel)) {
      let users = [];
      for (const user of channel.members) {
        const e = await this.userService.formatUser(await this.userService.users.get({ id: user }));
        users.push(e);
      }
      channelWithUsers.users = users;
      channelWithUsers.name = users
        .filter(u => u.id != context?.user?.id)
        .map(u => u.full_name)
        .join(", ");
    }
    return channelWithUsers;
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
      } else {
        if (options.addCreatorAsMember && savedChannel.owner) {
          try {
            await this.channelService.members.addUserToChannels({ id: savedChannel.owner }, [
              savedChannel,
            ]);
          } catch (err) {
            logger.warn({ err }, "Can not add owner as channel member");
          }
        }
      }

      this.updateLastActivity(
        {
          date: new Date().getTime(),
          channel: channel,
          message: null,
        },
        context,
      );

      localEventBus.publish<ResourceEventsPayload>("channel:created", {
        channel,
        user: context.user,
      });
    }
  }

  /**
   * Called when channel delete has been successfully called
   *
   * @param channel The channel to delete
   * @param result The delete result
   */
  onDeleted(channel: Channel, result: DeleteResult<Channel>): void {
    if (result.deleted) {
      logger.debug("Channel %s has been deleted", channel.id);
    }
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
