import { getLogger, RealtimeDeleted, RealtimeSaved } from "../../../../core/platform/framework";
import {
  CreateResult,
  CrudException,
  DeleteResult,
  ListResult,
  OperationType,
  Pagination,
  SaveResult,
  UpdateResult,
} from "../../../../core/platform/framework/api/crud-service";
import ChannelServiceAPI, { MemberService } from "../../provider";

import {
  Channel as ChannelEntity,
  ChannelMember,
  ChannelMemberPrimaryKey,
  getChannelMemberInstance,
  getMemberOfChannelInstance,
  MemberOfChannel,
} from "../../entities";
import {
  ChannelExecutionContext,
  ChannelMemberType,
  ChannelVisibility,
  WorkspaceExecutionContext,
} from "../../types";
import { Channel, ResourceEventsPayload, User } from "../../../../utils/types";
import { cloneDeep, isNil, omitBy } from "lodash";
import { updatedDiff } from "deep-object-diff";
import { pick } from "../../../../utils/pick";
import { getMemberPath, getRoomName } from "./realtime";
import { ChannelListOptions, ChannelMemberSaveOptions } from "../../web/types";
import { ResourcePath } from "../../../../core/platform/services/realtime/types";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import {
  PubsubParameter,
  PubsubPublish,
} from "../../../../core/platform/services/pubsub/decorators/publish";
import { localEventBus } from "../../../../core/platform/framework/pubsub";
import { plainToClass } from "class-transformer";
import UserServiceAPI, { CompaniesServiceAPI } from "../../../user/api";
import {
  ChannelCounterEntity,
  ChannelCounterPrimaryKey,
  ChannelUserCounterType,
  TYPE as ChannelCounterEntityType,
} from "../../entities/channel-counters";
import { CounterProvider } from "../../../../core/platform/services/counter/provider";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";
import { countRepositoryItems } from "../../../../utils/counters";
import { getService as getCompanyService } from "../../../user/services/companies";

const USER_CHANNEL_KEYS = [
  "id",
  "company_id",
  "workspace_id",
  "user_id",
  "channel_id",
  "type",
  "last_access",
  "last_increment",
  "favorite",
  "notification_level",
  "expiration",
] as const;

const CHANNEL_MEMBERS_KEYS = [
  "company_id",
  "workspace_id",
  "user_id",
  "channel_id",
  "type",
] as const;

const logger = getLogger("channel.member");

export class Service implements MemberService {
  version: "1";
  userChannelsRepository: Repository<ChannelMember>;
  channelMembersRepository: Repository<MemberOfChannel>;
  private channelCounter: CounterProvider<ChannelCounterEntity>;
  private companies: CompaniesServiceAPI;

  constructor(
    private platformServices: PlatformServicesAPI,
    private channelService: ChannelServiceAPI,
    protected userService: UserServiceAPI,
  ) {
    this.companies = this.userService.companies;
  }

  async init(): Promise<this> {
    try {
      this.userChannelsRepository = await this.platformServices.database.getRepository(
        "user_channels",
        ChannelMember,
      );
      this.channelMembersRepository = await this.platformServices.database.getRepository(
        "channel_members",
        MemberOfChannel,
      );
    } catch (err) {
      logger.error({ err }, "Can not initialize channel member service");
    }

    const channelCountersRepository =
      await this.platformServices.database.getRepository<ChannelCounterEntity>(
        ChannelCounterEntityType,
        ChannelCounterEntity,
      );

    this.channelCounter = await this.platformServices.counter.getCounter<ChannelCounterEntity>(
      channelCountersRepository,
    );

    this.channelCounter.setReviseCallback(async (pk: ChannelCounterPrimaryKey) => {
      if (pk.counter_type === ChannelUserCounterType.MESSAGES) {
        return;
      }
      const type =
        ChannelUserCounterType.MEMBERS === pk.counter_type
          ? ChannelMemberType.MEMBER
          : ChannelMemberType.GUEST;
      return countRepositoryItems(
        this.channelMembersRepository,
        { channel_id: pk.id, company_id: pk.company_id, workspace_id: pk.workspace_id },
        { type },
      );
    }, 400);

    return this;
  }

  @RealtimeSaved<ChannelMember>((member, context) => {
    return [
      //Send member preferences update to channels collections
      {
        room: `/companies/${member.company_id}/workspaces/${member.workspace_id}/channels?type=${
          member.workspace_id === ChannelVisibility.DIRECT ? "direct" : "private"
        }&user=${member.user_id}`,
        resource: {
          company_id: member.company_id,
          workspace_id: member.workspace_id,
          id: member.channel_id,
          user_member: member,
        },
      },
      {
        room: ResourcePath.get(getRoomName(context as ChannelExecutionContext)),
        path: getMemberPath(member, context as ChannelExecutionContext),
      },
    ];
  })
  async save(
    member: ChannelMember,
    options: ChannelMemberSaveOptions,
    context: ChannelExecutionContext,
  ): Promise<SaveResult<ChannelMember>> {
    let memberToSave: ChannelMember;
    const channel = await this.channelService.channels.get(context.channel);

    if (!channel) {
      throw CrudException.notFound("Channel does not exists");
    }

    const memberToUpdate = await this.userChannelsRepository.findOne(this.getPrimaryKey(member));
    const mode = memberToUpdate ? OperationType.UPDATE : OperationType.CREATE;

    logger.debug(`MemberService.save - ${mode} member %o`, memberToUpdate);

    if (mode === OperationType.UPDATE) {
      const isCurrentUser = this.isCurrentUser(memberToUpdate, context.user);

      if (!isCurrentUser) {
        throw CrudException.badRequest(`Channel member ${member.user_id} can not be updated`);
      }

      const updatableParameters: Partial<Record<keyof ChannelMember, boolean>> = {
        notification_level: isCurrentUser,
        favorite: isCurrentUser,
        last_access: isCurrentUser,
      };

      // Diff existing channel and input one, cleanup all the undefined fields for all objects
      const memberDiff = omitBy(updatedDiff(memberToUpdate, member), isNil);
      const fields = Object.keys(memberDiff) as Array<Partial<keyof ChannelMember>>;

      if (!fields.length) {
        return new SaveResult<ChannelMember>("channel_member", member, mode);
      }

      const updatableFields = fields.filter(field => updatableParameters[field]);

      if (!updatableFields.length) {
        throw CrudException.badRequest("Current user can not update requested fields");
      }

      memberToSave = cloneDeep(memberToUpdate);

      //Ensure it is a boolean
      memberToSave.favorite = !!memberToSave.favorite;

      updatableFields.forEach(field => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (memberToSave as any)[field] = member[field];
      });

      await this.saveChannelMember(memberToSave);
      this.onUpdated(
        context.channel,
        memberToSave,
        new UpdateResult<ChannelMember>("channel_member", memberToSave),
      );
    } else {
      const currentUserIsMember = !!(await this.isChannelMember(context.user, channel));
      const isPrivateChannel = ChannelEntity.isPrivateChannel(channel);
      const isPublicChannel = ChannelEntity.isPublicChannel(channel);
      const isDirectChannel = ChannelEntity.isDirectChannel(channel);
      const userIsDefinedInChannelUserList = (channel.members || []).includes(
        String(member.user_id),
      );
      const isChannelCreator = context.user && String(channel.owner) === String(context.user.id);

      // 1. Private channel: user can not join private channel by themself when it is private
      // only member can add other users in channel
      // 2. The channel creator check is only here on channel creation
      if (
        isChannelCreator ||
        (isPrivateChannel && currentUserIsMember) ||
        isPublicChannel ||
        (isDirectChannel && userIsDefinedInChannelUserList)
      ) {
        const memberToSave = { ...member, ...context.channel };
        await this.saveChannelMember(memberToSave);

        await this.usersCounterIncrease(channel, member.user_id);
        this.onCreated(
          channel,
          member,
          context.user,
          new CreateResult<ChannelMember>("channel_member", memberToSave),
        );
      } else {
        throw CrudException.badRequest(
          `User ${member.user_id} is not allowed to join this channel`,
        );
      }
    }

    return new SaveResult<ChannelMember>("channel_member", member, mode);
  }

  async get(pk: ChannelMemberPrimaryKey): Promise<ChannelMember> {
    // FIXME: Who can fetch a single member?
    return await this.userChannelsRepository.findOne(this.getPrimaryKey(pk));
  }

  @RealtimeDeleted<ChannelMember>((member, context) => [
    {
      room: `/companies/${member.company_id}/workspaces/${member.workspace_id}/channels?type=${
        member.workspace_id === ChannelVisibility.DIRECT ? "direct" : "private"
      }&user=${member.user_id}`,
      resource: {
        company_id: member.company_id,
        workspace_id: member.workspace_id,
        id: member.channel_id,
        user_id: member.user_id,
        user_member: null,
      },
    },
    {
      room: ResourcePath.get(getRoomName(context as ChannelExecutionContext)),
      path: getMemberPath(member, context as ChannelExecutionContext),
    },
  ])
  async delete(
    pk: ChannelMemberPrimaryKey,
    context: ChannelExecutionContext,
  ): Promise<DeleteResult<ChannelMember>> {
    const memberToDelete = await this.userChannelsRepository.findOne(pk);
    const channel = await this.channelService.channels.get(context.channel);

    if (!channel) {
      throw CrudException.notFound("Channel does not exists");
    }

    if (!memberToDelete) {
      throw CrudException.notFound("Channel member not found");
    }

    if (ChannelEntity.isDirectChannel(channel)) {
      if (!this.isCurrentUser(memberToDelete, context.user)) {
        throw CrudException.badRequest("User can not remove other users from direct channel");
      }
    }

    if (ChannelEntity.isPrivateChannel(channel)) {
      const canLeave = await this.canLeavePrivateChannel(context.user, channel);

      if (!canLeave) {
        throw CrudException.badRequest("User can not leave the private channel");
      }
    }

    await this.userChannelsRepository.remove(getChannelMemberInstance(pk));
    await this.channelMembersRepository.remove(getMemberOfChannelInstance(pk));
    await this.usersCounterIncrease(channel, pk.user_id, -1);

    this.onDeleted(memberToDelete, context.user, channel);

    return new DeleteResult<ChannelMember>("channel_member", pk as ChannelMember, true);
  }

  /**
   * List given channel members
   */
  async list(
    pagination: Pagination,
    options: ChannelListOptions,
    context: ChannelExecutionContext,
  ): Promise<ListResult<ChannelMember>> {
    const channel = await this.channelService.channels.get({
      company_id: context.channel.company_id,
      workspace_id: context.channel.workspace_id,
      id: context.channel.id,
    });

    if (!channel) {
      throw CrudException.notFound("Channel not found");
    }

    if (ChannelEntity.isDirectChannel(channel) || ChannelEntity.isPrivateChannel(channel)) {
      const isMember = await this.isChannelMember(context.user, channel);

      if (!isMember) {
        throw CrudException.badRequest("User does not have enough rights to get channels");
      }
    }

    const result = await this.channelMembersRepository.find(
      {
        company_id: context.channel.company_id,
        workspace_id: context.channel.workspace_id,
        channel_id: context.channel.id,
      },
      { pagination },
    );

    const companyUsers = await this.userService.companies.getUsers(
      {
        group_id: context.channel.company_id,
      },
      {},
      { userIds: result.getEntities().map(member => member.user_id) },
    );

    if (options.company_role) {
      companyUsers.filterEntities(entity => entity.role === options.company_role);
    }

    const companyUserIds = companyUsers.getEntities().map(entity => entity.user_id);

    result.filterEntities(cm => companyUserIds.includes(cm.user_id));

    return new ListResult<ChannelMember>(
      "channel_member",
      result
        .getEntities()
        .map(member => plainToClass(ChannelMember, { id: member.user_id, ...member })),
      result.nextPage,
    );
  }

  async listUserChannels(
    user: User,
    pagination: Pagination,
    context: WorkspaceExecutionContext,
  ): Promise<ListResult<ChannelMember>> {
    const result = await this.userChannelsRepository.find(
      {
        company_id: context.workspace.company_id,
        workspace_id: context.workspace.workspace_id,
        user_id: user.id,
      },
      { pagination },
    );

    return new ListResult<ChannelMember>(
      "channel_member",
      result
        .getEntities()
        .map(member => plainToClass(ChannelMember, { id: member.user_id, ...member })),
      result.nextPage,
    );
  }

  /**
   * Can leave only if the number of members is > 1
   * since counting rows in DB takes too much time
   * we query a list for 2 members without offset and check the length
   */
  async canLeavePrivateChannel(user: User, channel: ChannelEntity): Promise<boolean> {
    const list = this.list(new Pagination(undefined, "2"), {}, { channel, user });

    return (await list).getEntities().length > 1;
  }

  async addUsersToChannel(
    users: Pick<User, "id">[] = [],
    channel: ChannelEntity,
  ): Promise<
    ListResult<{ channel: ChannelEntity; added: boolean; member?: ChannelMember; err?: Error }>
  > {
    if (!channel) {
      throw CrudException.badRequest("Channel is required");
    }
    logger.debug(
      "Add users %o to channel %o",
      users.map(u => u.id),
      channel.id,
    );

    const members: Array<{
      channel: ChannelEntity;
      added: boolean;
      member?: ChannelMember;
      err?: Error;
    }> = await Promise.all(
      users.map(async user => {
        const context: ChannelExecutionContext = {
          channel,
          user,
        };

        const member: ChannelMember = getChannelMemberInstance({
          channel_id: channel.id,
          company_id: channel.company_id,
          workspace_id: channel.workspace_id,
          user_id: user.id,
        } as ChannelMember);

        try {
          const isAlreadyMember = await this.isChannelMember(user, channel);
          if (isAlreadyMember) {
            logger.debug("User %s is already member in channel %s", member.user_id, channel.id);
            return { channel, added: false };
          }

          const result = await this.save(member, null, context);

          return {
            channel,
            added: true,
            member: result.entity,
          };
        } catch (err) {
          logger.warn({ err }, "Member has not been added %o", member);
          return {
            channel,
            err,
            added: false,
          };
        }
      }),
    );

    return new ListResult("channel_member", members);
  }

  async addUserToChannels(
    user: Pick<User, "id">,
    channels: ChannelEntity[],
  ): Promise<
    ListResult<{ channel: ChannelEntity; added: boolean; member?: ChannelMember; err?: Error }>
  > {
    logger.debug(
      "Add user %s to channels %o",
      user.id,
      channels.map(c => c.id),
    );
    const members: Array<{
      channel: ChannelEntity;
      added: boolean;
      member?: ChannelMember;
      err?: Error;
    }> = await Promise.all(
      channels.map(async channel => {
        const context: ChannelExecutionContext = {
          channel,
          user,
        };

        const member = getChannelMemberInstance({
          channel_id: channel.id,
          company_id: channel.company_id,
          workspace_id: channel.workspace_id,
          user_id: user.id,
        });

        try {
          const isAlreadyMember = await this.isChannelMember(user, channel);
          if (isAlreadyMember) {
            logger.debug("User %s is already member in channel %s", member.user_id, channel.id);
            return { channel, added: false };
          }

          const result = await this.save(member, null, context);

          return { channel, member: result.entity, added: true };
        } catch (err) {
          logger.warn({ err }, "Member has not been added %o", member);
          return { channel, added: false, err };
        }
      }),
    );

    return new ListResult("channel_member", members);
  }

  @PubsubPublish("channel:member:updated")
  onUpdated(
    @PubsubParameter("channel")
    channel: Channel,
    @PubsubParameter("member")
    member: ChannelMember,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateResult: UpdateResult<ChannelMember>,
  ): void {
    logger.debug("Member updated %o", member);
  }

  @PubsubPublish("channel:member:created")
  onCreated(
    @PubsubParameter("channel")
    channel: ChannelEntity,
    @PubsubParameter("member")
    member: ChannelMember,
    @PubsubParameter("user")
    user: User,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createResult: SaveResult<ChannelMember>,
  ): void {
    logger.debug("Member created %o", member);

    // Not sure about this, we use it on Tracker + Activities
    localEventBus.publish<ResourceEventsPayload>("channel:member:created", {
      channel,
      user,
      member,
      actor: user,
      resourcesAfter: [member],
    });
  }

  @PubsubPublish("channel:member:deleted")
  onDeleted(
    @PubsubParameter("member")
    member: ChannelMember,
    @PubsubParameter("user")
    user: User,
    @PubsubParameter("channel")
    channel: ChannelEntity,
  ): void {
    logger.debug("Member deleted %o", member);

    localEventBus.publish<ResourceEventsPayload>("channel:member:deleted", {
      actor: user,
      resourcesBefore: [member],
      channel: channel,
      user,
    });
  }

  isCurrentUser(member: ChannelMember | MemberOfChannel, user: User): boolean {
    return String(member.user_id) === String(user.id);
  }

  isChannelMember(user: User, channel: Channel): Promise<ChannelMember> {
    if (!user) {
      return;
    }

    return this.get({
      channel_id: channel.id,
      company_id: channel.company_id,
      workspace_id: channel.workspace_id,
      user_id: user.id,
    });
  }

  getPrimaryKey(
    memberOrPrimaryKey: ChannelMember | ChannelMemberPrimaryKey,
  ): ChannelMemberPrimaryKey {
    return pick(
      memberOrPrimaryKey,
      ...(["company_id", "workspace_id", "channel_id", "user_id"] as const),
    );
  }

  private async usersCounterIncrease(channel: Channel, userId: string, increaseValue: number = 1) {
    // const isMember = await this.isCompanyMember(channel.company_id, userId);
    const isMember = true; // Since actually all users are now added to the channel as members, we are removing the guest counter for now.
    const counter_type = isMember ? ChannelUserCounterType.MEMBERS : ChannelUserCounterType.GUESTS;
    return this.channelCounter.increase(
      {
        id: channel.id,
        company_id: channel.company_id,
        workspace_id: channel.workspace_id,
        counter_type,
      },
      increaseValue,
    );
  }

  getUsersCount(pk: ChannelCounterPrimaryKey): Promise<number> {
    return this.channelCounter.get(pk);
  }

  async isCompanyMember(companyId: string, userId: string): Promise<boolean> {
    return (await this.companies.getUserRole(companyId, userId)) != "guest";
  }

  private async saveChannelMember(memberToSave: ChannelMember & Channel) {
    const userChannel = getChannelMemberInstance(pick(memberToSave, ...USER_CHANNEL_KEYS));
    const channelMember = getMemberOfChannelInstance(pick(memberToSave, ...CHANNEL_MEMBERS_KEYS));
    await this.userChannelsRepository.save(userChannel);
    await this.channelMembersRepository.save(channelMember);
  }
}
