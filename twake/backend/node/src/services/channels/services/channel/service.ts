import { cloneDeep, pickBy } from "lodash";
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
  ListOptions,
} from "../../../../core/platform/framework/api/crud-service";
import { ChannelPrimaryKey, MemberService } from "../../provider";

import { Channel } from "../../entities";
import { getChannelPath, getRoomName } from "./realtime";
import { WorkspaceExecutionContext } from "../../types";
import { isWorkspaceAdmin as userIsWorkspaceAdmin } from "../../../../utils/workspace";
import { User } from "../../../../services/types";
import { pick } from "../../../../utils/pick";
import { ChannelService } from "../../provider";

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
  async save(channel: Channel, context: WorkspaceExecutionContext): Promise<SaveResult<Channel>> {
    let channelToUpdate: Channel;
    let channelToSave: Channel;
    const mode = channel.id ? OperationType.UPDATE : OperationType.CREATE;
    const isWorkspaceAdmin = userIsWorkspaceAdmin(context.user, context.workspace);

    if (mode === OperationType.UPDATE) {
      channelToUpdate = await this.get(this.getPrimaryKey(channel), context);

      if (!channelToUpdate) {
        throw new CrudExeption("Channel not found", 404);
      }

      const isChannelOwner = this.isChannelOwner(channelToUpdate, context.user);
      const updatableParameters: Partial<Record<keyof Channel, boolean>> = {
        name: true,
        description: true,
        icon: true,
        is_default: isWorkspaceAdmin || isChannelOwner,
        visibility: isWorkspaceAdmin || isChannelOwner,
        archived: isWorkspaceAdmin || isChannelOwner,
      };

      // Diff existing channel and input one, cleanup all the undefined fields for all objects
      const channelDiff = pickBy(updatedDiff(channelToUpdate, channel));
      const fields = Object.keys(channelDiff) as Array<Partial<keyof Channel>>;

      if (!fields.length) {
        throw new CrudExeption("Nothing to update", 400);
      }

      const updatableFields = fields.filter(field => updatableParameters[field]);

      if (!updatableFields.length) {
        throw new CrudExeption("Current user can not update requested fields", 400);
      }

      channelToSave = cloneDeep(channelToUpdate);

      updatableFields.forEach(field => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (channelToSave as any)[field] = channel[field];
      });
    }

    if (mode === OperationType.CREATE) {
      channelToSave = channel;
    }

    const saveResult = await this.service.save(channelToSave, context);

    this.onSaved(channelToSave, saveResult, mode);

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
    options: ListOptions,
    context: WorkspaceExecutionContext,
  ): Promise<ListResult<Channel>> {
    if (options?.mine) {
      const userChannels = await this.members.listUserChannels(context.user, pagination, context);

      options.channels = userChannels.entities.map(channelMember => channelMember.channel_id);
    }

    return this.service.list(pagination, options, context);
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
  onSaved(
    channel: Channel,
    result: SaveResult<Channel>,
    mode: OperationType.CREATE | OperationType.UPDATE,
  ): void {
    const saved = result.entity;

    if (!saved) {
      return;
    }

    const pushUpdates = {
      is_default: !!saved.is_default && saved.is_default !== channel.is_default,
      archived: !!saved.archived && saved.archived !== channel.archived,
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
