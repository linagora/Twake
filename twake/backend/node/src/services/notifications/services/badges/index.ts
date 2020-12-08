import {
  MongoConnector,
  CassandraConnector,
} from "../../../../core/platform/services/database/services/orm/connectors";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { UserNotificationBadgeServiceAPI } from "../../api";
import { MongoUserNotificationBadgeService } from "./mongo";
import { CassandraUserNotificationBadgeService } from "./cassandra";
import { Service } from "./service";

export function getService(databaseService: DatabaseServiceAPI): UserNotificationBadgeServiceAPI {
  return new Service(getServiceInstance(databaseService));
}

function getServiceInstance(databaseService: DatabaseServiceAPI): UserNotificationBadgeServiceAPI {
  const type = databaseService.getConnector().getType();

  switch (type) {
    case "mongodb":
      return new MongoUserNotificationBadgeService(
        (databaseService.getConnector() as MongoConnector).getDatabase(),
      );
    case "cassandra":
      const connector = databaseService.getConnector() as CassandraConnector;

      return new CassandraUserNotificationBadgeService(
        connector.getClient(),
        connector.getOptions(),
      );
    default:
      throw new Error(`${type} service is not supported`);
  }
}
