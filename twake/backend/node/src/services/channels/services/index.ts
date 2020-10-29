import { MongoConnector } from "../../../core/platform/services/database/services/connectors/mongodb";
import { CassandraConnector } from "../../../core/platform/services/database/services/connectors/cassandra";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import ChannelServiceAPI from "../provider";

import { MongoChannelService } from "./mongo";
import { CassandraChannelService } from "./cassandra";

export function getService(databaseService: DatabaseServiceAPI): ChannelServiceAPI {
  const type = databaseService.getConnector().getType();

  switch(type) {
    case "mongodb":
      return new MongoChannelService((databaseService.getConnector() as MongoConnector).getDatabase());
    case "cassandra":
      throw new CassandraChannelService((databaseService.getConnector() as CassandraConnector).getClient());
    default:
      throw new Error(`${type} service is not supported`);
  }
}