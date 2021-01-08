import {
  MongoConnector,
  CassandraConnector,
} from "../../../../core/platform/services/database/services/orm/connectors";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import ChannelServiceAPI, { MemberService } from "../../provider";
import { MongoMemberService } from "./mongo";
import { CassandraMemberService } from "./cassandra";
import { Service } from "./service";

export function getService(
  databaseService: DatabaseServiceAPI,
  channelService: ChannelServiceAPI,
): MemberService {
  return new Service(getServiceInstance(databaseService), channelService);
}

function getServiceInstance(databaseService: DatabaseServiceAPI): MemberService {
  const type = databaseService.getConnector().getType();

  switch (type) {
    case "mongodb":
      return new MongoMemberService(databaseService.getConnector() as MongoConnector);
    case "cassandra":
      const connector = databaseService.getConnector() as CassandraConnector;

      return new CassandraMemberService(connector.getClient(), connector.getOptions());
    default:
      throw new Error(`${type} service is not supported`);
  }
}
