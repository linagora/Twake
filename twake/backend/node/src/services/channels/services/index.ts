import { MongoConnector } from "../../database/services/connectors/mongodb";
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
      throw new CassandraChannelService();
    default:
      throw new Error(`${type} service is not supported`);
  }
}