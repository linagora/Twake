import { RealtimeCreated, RealtimeUpdated, RealtimeDeleted } from "../../../core/platform/framework";
import { CreateResult, UpdateResult, DeleteResult, ExecutionContext } from "../../../core/platform/framework/api/crud-service";
import { MongoConnector } from "../../../core/platform/services/database/services/connectors/mongodb";
import { CassandraConnector } from "../../../core/platform/services/database/services/connectors/cassandra";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import ChannelServiceAPI from "../provider";

import { MongoChannelService } from "./mongo";
import { CassandraChannelService } from "./cassandra";
import { Channel } from "../entities";
import { getChannelPath } from "../realtime";

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

  @RealtimeCreated<Channel>("/channels", (channel, context) => getChannelPath(channel, context))
  async create(channel: Channel, context: ExecutionContext): Promise<CreateResult<Channel>> {
    return this.service.create(channel, context);
  }

  get(id: string, context: ExecutionContext): Promise<Channel> {
    return this.service.get(id, context);
  }

  @RealtimeUpdated<Channel>("/channels", (channel, context) => getChannelPath(channel, context))
  update(id: string, channel: Channel, context: ExecutionContext): Promise<UpdateResult<Channel>> {
    return this.service.update(id, channel, context);
  }

  @RealtimeDeleted<Channel>("/channels", (channel, context) => getChannelPath(channel, context))
  delete(id: string, context: ExecutionContext): Promise<DeleteResult<Channel>> {
    return this.service.delete(id, context);
  }

  list(context: ExecutionContext): Promise<Channel[]> {
    return this.service.list(context);
  }
}