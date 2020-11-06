import { RealtimeSaved, RealtimeUpdated, RealtimeDeleted } from "../../../core/platform/framework";
import {
  UpdateResult,
  DeleteResult,
  Pagination,
  ListResult,
  SaveResult,
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
    return this.service.save(channel, context);
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
}
