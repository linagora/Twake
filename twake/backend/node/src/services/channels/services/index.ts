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
import { pickBy } from "lodash";

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
      channelToUpdate = await this.get(channel, context);

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

      channelToSave = { ...channelToUpdate };

      updatableFields.forEach(field => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (channelToSave as any)[field] = channel[field];
      });
    }

    if (mode === OperationType.CREATE) {
      channelToSave = channel;
    }

    const saveResult = await this.service.save(channelToSave, context);
    const savedChannel = saveResult.entity;

    // TODO: This must be done in some listeners, the core service does not have to manage this

    if (mode === OperationType.CREATE) {
      const pushUpdates = {
        is_default: !!savedChannel.is_default,
      };
    }

    if (mode === OperationType.UPDATE) {
      const pushUpdates = {
        is_default: !!channel.is_default && channel.is_default !== channelToUpdate.is_default,
        archived: !!channel.archived && channel.archived !== channelToUpdate.archived,
      };
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
  delete(
    pk: ChannelPrimaryKey,
    context: WorkspaceExecutionContext,
  ): Promise<DeleteResult<Channel>> {
    return this.service.delete(pk, context);
  }

  list(pagination: Pagination, context: WorkspaceExecutionContext): Promise<ListResult<Channel>> {
    return this.service.list(pagination, context);
  }

  isChannelOwner(channel: Channel, user: User): boolean {
    return channel.owner && channel.owner === user.id;
  }
}
