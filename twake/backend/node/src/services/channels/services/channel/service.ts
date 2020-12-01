import { cloneDeep, find, pickBy } from "lodash";
import { updatedDiff } from "deep-object-diff";
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
import { ChannelPrimaryKey, MemberService } from "../../provider";
import { logger } from "../../../../core/platform/framework";

import { Channel, ChannelMember, UserChannel, UserDirectChannel } from "../../entities";
import { getChannelPath, getRoomName } from "./realtime";
import { ChannelType, ChannelVisibility, WorkspaceExecutionContext } from "../../types";
import { isWorkspaceAdmin as userIsWorkspaceAdmin } from "../../../../utils/workspace";
import { User } from "../../../../services/types";
import { pick } from "../../../../utils/pick";
import { ChannelService } from "../../provider";
import { DirectChannel } from "../../entities/direct-channel";
import { ChannelListOptions, ChannelSaveOptions } from "../../web/types";

export class Service implements ChannelService {
  version: "1";

  constructor(private service: ChannelService, private members: MemberService) {}

  async init(): Promise<this> {
    try {
      this.service.init && (await this.service.init());
    } catch (err) {
      console.error("Can not initialize database service");
    }

    return this;
  }

  @RealtimeSaved<Channel>(
    (channel, context) => getRoomName(channel, context as WorkspaceExecutionContext),
    (channel, context) => getChannelPath(channel, context as WorkspaceExecutionContext),
  )
  async save(
    channel: Channel,
    options: ChannelSaveOptions,
    context: WorkspaceExecutionContext,
  ): Promise<SaveResult<Channel>> {
    let channelToUpdate: Channel;
    let channelToSave: Channel;
    const mode = channel.id ? OperationType.UPDATE : OperationType.CREATE;
    const isWorkspaceAdmin = userIsWorkspaceAdmin(context.user, context.workspace);
    const isDirectChannel = channel.workspace_id === ChannelVisibility.DIRECT;

    if (isDirectChannel) {
      channel.visibility = ChannelVisibility.DIRECT;
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
        is_default: (isWorkspaceAdmin || isChannelOwner) && !isDirectChannel,
        archived: isWorkspaceAdmin || isChannelOwner,
      };

      // Diff existing channel and input one, cleanup all the undefined fields for all objects
      const channelDiff = pickBy(updatedDiff(channelToUpdate, channel));
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
    }

    if (mode === OperationType.CREATE) {
      if (isDirectChannel) {
        options.members = Array.from(new Set<string>(options?.members || []).add(context.user.id));

        logger.info("Direct channel creation with members %o", options.members);
        if (context.workspace.workspace_id !== ChannelVisibility.DIRECT) {
          throw CrudExeption.badRequest("Direct Channel creation error: bad workspace");
        }

        const directChannel = await this.getDirectChannelInCompany(
          context.workspace.company_id,
          options.members,
        );

        if (directChannel) {
          logger.info("Direct channel already exists");
          const existingChannel = await this.get(
            {
              company_id: context.workspace.company_id,
              id: directChannel.channel_id,
              workspace_id: ChannelType.DIRECT,
            },
            context,
          );
          return new SaveResult<Channel>("channels", existingChannel, OperationType.EXISTS);
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

  @RealtimeUpdated<Channel>(
    (channel, context) => getRoomName(channel, context as WorkspaceExecutionContext),
    (channel, context) => getChannelPath(channel, context as WorkspaceExecutionContext),
  )
  update(
    pk: ChannelPrimaryKey,
    channel: Channel,
    context: WorkspaceExecutionContext,
  ): Promise<UpdateResult<Channel>> {
    return this.service.update(pk, channel, context);
  }

  @RealtimeDeleted<Channel>(
    (channel, context) => getRoomName(channel, context as WorkspaceExecutionContext),
    (channel, context) => getChannelPath(channel, context as WorkspaceExecutionContext),
  )
  async delete(
    pk: ChannelPrimaryKey,
    context: WorkspaceExecutionContext,
  ): Promise<DeleteResult<Channel>> {
    const channelToDelete = await this.get(this.getPrimaryKey(pk), context);

    if (!channelToDelete) {
      throw new CrudExeption("Channel not found", 404);
    }

    if (Channel.isDirect(channelToDelete)) {
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

  async list(
    pagination: Pagination,
    options: ChannelListOptions,
    context: WorkspaceExecutionContext,
  ): Promise<ListResult<Channel | UserChannel | UserDirectChannel>> {
    const isDirectWorkspace = context.workspace.workspace_id === ChannelVisibility.DIRECT;

    if (options?.mine || isDirectWorkspace) {
      // TODO: When direct, get the direct channel members
      const userChannels = await this.members.listUserChannels(context.user, pagination, context);

      options.channels = userChannels.getEntities().map(channelMember => channelMember.channel_id);

      const result = await this.service.list(pagination, options, context);

      result.mapEntities(<UserChannel>(channel: Channel) => {
        const userChannel = find(userChannels.getEntities(), { channel_id: channel.id });

        return ({ ...channel, ...{ user_member: userChannel } } as unknown) as UserChannel;
      });

      if (isDirectWorkspace) {
        const channelIds = userChannels
          .getEntities()
          .map(channelMember => channelMember.channel_id);
        const directChannels = await this.listDirectChannels(
          context.workspace.company_id,
          channelIds,
        );
        result.mapEntities(<UserDirectChannel>(channel: UserChannel) => {
          const directChannel = find(directChannels, { channel_id: channel.id });
          return ({
            ...channel,
            ...{ members: DirectChannel.getUsersFromString(directChannel.users) },
          } as unknown) as UserDirectChannel;
        });
      }

      return result;
    }

    // TODO: Do not return direct channels the current user is not part of...
    return this.service.list(pagination, options, context);
  }

  createDirectChannel(directChannel: DirectChannel): Promise<DirectChannel> {
    return this.service.createDirectChannel(directChannel);
  }

  getDirectChannel(directChannel: DirectChannel): Promise<DirectChannel> {
    return this.service.getDirectChannel(directChannel);
  }

  listDirectChannels(companyId: string, channelIds: string[]): Promise<DirectChannel[]> {
    return this.service.listDirectChannels(companyId, channelIds);
  }

  getDirectChannelInCompany(companyId: string, users: string[]): Promise<DirectChannel> {
    return this.service.getDirectChannelInCompany(companyId, users);
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
      const isDirect =
        options &&
        options.members &&
        options.members.length &&
        channel.visibility === ChannelVisibility.DIRECT;

      if (isDirect) {
        const directChannel = {
          channel_id: savedChannel.id,
          company_id: savedChannel.company_id,
          users: DirectChannel.getUsersAsString(options.members),
        } as DirectChannel;
        // add members
        // invite members
        // etc...
        await this.createDirectChannel(directChannel);

        const members = options.members.map(user_id => {
          return {
            user_id,
            channel_id: savedChannel.id,
            workspace_id: savedChannel.workspace_id,
            company_id: savedChannel.company_id,
          } as ChannelMember;
        });

        await Promise.all(
          members.map(member =>
            this.members.save(member, {}, { channel: savedChannel, user: context.user }),
          ),
        );
      }
    }

    const pushUpdates = {
      is_default: !!savedChannel.is_default && savedChannel.is_default !== channel.is_default,
      archived: !!savedChannel.archived && savedChannel.archived !== channel.archived,
    };

    console.log(`PUSH ${mode}`, pushUpdates);
  }

  /**
   * Called when channel delete has been successfully called
   *
   * @param channel The channel to delete
   * @param result The delete result
   */
  onDeleted(channel: Channel, result: DeleteResult<Channel>): void {
    console.log("PUSH DELETE ASYNC", channel, result);
  }
}
