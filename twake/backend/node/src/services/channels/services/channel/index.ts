import {
  MongoConnector,
  CassandraConnector,
} from "../../../../core/platform/services/database/services/connectors";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { ChannelService, MemberService } from "../../provider";
import { MongoChannelService } from "./mongo";
import { CassandraChannelService } from "./cassandra";
import { Service } from "./service";

export function getService(
  databaseService: DatabaseServiceAPI,
  memberService: MemberService,
): ChannelService {
  return new Service(getServiceInstance(databaseService), memberService);
}

function getServiceInstance(databaseService: DatabaseServiceAPI): ChannelService {
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
