import { updatedDiff } from "deep-object-diff";
import { RealtimeSaved, RealtimeUpdated, RealtimeDeleted } from "../../../core/platform/framework";
import {
  UpdateResult,
  DeleteResult,
  Pagination,
  ListResult,
  SaveResult,
  OperationType,
  CrudExeption,
} from "../../../core/platform/framework/api/crud-service";
import { MongoConnector } from "../../../core/platform/services/database/services/connectors/mongodb";
import { CassandraConnector } from "../../../core/platform/services/database/services/connectors/cassandra";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import ChannelServiceAPI, { ChannelPrimaryKey } from "../provider";

import { MongoChannelService } from "./mongo";
import { CassandraChannelService } from "./cassandra";
import { Channel } from "../entities";
import { getChannelPath, getRoomName } from "../realtime";
import { WorkspaceExecutionContext } from "../types";
import { isWorkspaceAdmin as userIsWorkspaceAdmin } from "../../../utils/workspace";
import { User } from "../../../services/types";
import { cloneDeep, pickBy } from "lodash";
import { pick } from "../../../utils/pick";

export function getService(databaseService: DatabaseServiceAPI): ChannelServiceAPI {
  return new Service(getServiceInstance(databaseService));
}

function getServiceInstance(databaseService: DatabaseServiceAPI): ChannelServiceAPI {
  const type = databaseService.getConnector().getType();

  switch (type) {
    case "mongodb":
      return new MongoChannelService(
        (databaseService.getConnector() as MongoConnector).getDatabase(),
      );
    case "cassandra":
      const connector = databaseService.getConnector() as CassandraConnector;

      return new CassandraChannelService(connector.getClient(), connector.getOptions());
    default:
      throw new Error(`${type} service is not supported`);
  }
}

class Service implements ChannelServiceAPI {
  version: "1";

  constructor(private service: ChannelServiceAPI) {}

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

    if (mode === OperationType.CREATE) {
      await this.onCreated(channelToSave, saveResult);
    }

    if (mode === OperationType.UPDATE) {
      await this.onUpdated(channelToSave, saveResult);
    }

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

    await this.onDeleted(channelToDelete, result);

    return result;
  }

  list(pagination: Pagination, context: WorkspaceExecutionContext): Promise<ListResult<Channel>> {
    return this.service.list(pagination, context);
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
  async onUpdated(channel: Channel, result: SaveResult<Channel>): Promise<SaveResult<Channel>> {
    const saved = result.entity;

    if (!saved) {
      return result;
    }

    const pushUpdates = {
      is_default: !!saved.is_default && saved.is_default !== channel.is_default,
      archived: !!saved.archived && saved.archived !== channel.archived,
    };

    console.log("PUSH UPDATE", pushUpdates);

    return result;
  }

  /**
   * Called when channel create has been successfully called
   *
   * @param channel The channel entity before save
   * @param result The channel save result
   */
  async onCreated(channel: Channel, result: SaveResult<Channel>): Promise<SaveResult<Channel>> {
    const pushUpdates = {
      is_default: !!result.entity.is_default,
    };
    console.log("PUSH CREATE", pushUpdates);
    return result;
  }

  /**
   * Called when channel delete has been successfully called
   *
   * @param channel The channel to delete
   * @param result The delete result
   */
  async onDeleted(
    channel: Channel,
    result: DeleteResult<Channel>,
  ): Promise<DeleteResult<ChannelPrimaryKey>> {
    console.log("PUSH DELETE ASYNC", channel, result);

    return result;
  }
}
