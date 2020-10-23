import { MongoConnector } from "../../database/services/connectors/mongodb";
import { CassandraConnector } from "../../database/services/connectors/cassandra";
import { DatabaseServiceAPI } from "../../database/api";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";

import { MongoChannelService } from "./mongo";
import { CassandraChannelService } from "./cassandra";

export function getService(databaseService: DatabaseServiceAPI): ChannelServiceAPI<Channel> {
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