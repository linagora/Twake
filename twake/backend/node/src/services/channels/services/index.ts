import { RealtimeCreated, RealtimeUpdated, RealtimeDeleted } from "../../../core/platform/framework";
import { CreateResult, UpdateResult, DeleteResult } from "../../../core/platform/framework/api/crud-service";
import { MongoConnector } from "../../../core/platform/services/database/services/connectors/mongodb";
import { CassandraConnector } from "../../../core/platform/services/database/services/connectors/cassandra";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import ChannelServiceAPI from "../provider";

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

  switch(type) {
    case "mongodb":
      return new MongoChannelService((databaseService.getConnector() as MongoConnector).getDatabase());
    case "cassandra":
      return new CassandraChannelService((databaseService.getConnector() as CassandraConnector).getClient());
    default:
      throw new Error(`${type} service is not supported`);
  }
}

class Service implements ChannelServiceAPI {
  version: "1";

  constructor(private service: ChannelServiceAPI) {}

  @RealtimeCreated<Channel>(
    (channel, context) => getRoomName(channel, context as WorkspaceExecutionContext),
    (channel, context) => getChannelPath(channel, context as WorkspaceExecutionContext)
  )
  async create(channel: Channel, context: WorkspaceExecutionContext): Promise<CreateResult<Channel>> {
    return this.service.create(channel, context);
  }

  get(id: string, context: WorkspaceExecutionContext): Promise<Channel> {
    return this.service.get(id, context);
  }

  @RealtimeUpdated<Channel>(
    (channel, context) => getRoomName(channel, context as WorkspaceExecutionContext),
    (channel, context) => getChannelPath(channel, context as WorkspaceExecutionContext)
  )
  update(id: string, channel: Channel, context: WorkspaceExecutionContext): Promise<UpdateResult<Channel>> {
    return this.service.update(id, channel, context);
  }

  @RealtimeDeleted<Channel>(
    (channel, context) => getRoomName(channel, context as WorkspaceExecutionContext),
    (channel, context) => getChannelPath(channel, context as WorkspaceExecutionContext))
  delete(id: string, context: WorkspaceExecutionContext): Promise<DeleteResult<Channel>> {
    return this.service.delete(id, context);
  }

  list(context: WorkspaceExecutionContext): Promise<Channel[]> {
    return this.service.list(context);
  }
}