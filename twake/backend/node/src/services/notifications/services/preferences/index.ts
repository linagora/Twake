import {
  MongoConnector,
  CassandraConnector,
} from "../../../../core/platform/services/database/services/connectors";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { ChannelMemberPreferencesServiceAPI } from "../../api";
import { Service } from "./service";
import { MongoChannelMemberPreferencesService } from "./mongo";
import { CassandraChannelMemberPreferencesService } from "./cassandra";

export function getService(
  databaseService: DatabaseServiceAPI,
): ChannelMemberPreferencesServiceAPI {
  return new Service(getServiceInstance(databaseService));
}

function getServiceInstance(
  databaseService: DatabaseServiceAPI,
): ChannelMemberPreferencesServiceAPI {
  const type = databaseService.getConnector().getType();

  switch (type) {
    case "mongodb":
      return new MongoChannelMemberPreferencesService(
        (databaseService.getConnector() as MongoConnector).getDatabase(),
      );
    case "cassandra":
      const connector = databaseService.getConnector() as CassandraConnector;

      return new CassandraChannelMemberPreferencesService(
        connector.getClient(),
        connector.getOptions(),
      );
    default:
      throw new Error(`${type} service is not supported`);
  }
}
