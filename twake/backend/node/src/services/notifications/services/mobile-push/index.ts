import UserServiceAPI from "../../../../services/user/api";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { MobilePushService } from "./service";
import { NotificationConfiguration } from "../../types";

export function getService(
  databaseService: DatabaseServiceAPI,
  pushConfiguration: NotificationConfiguration["push"],
): MobilePushService {
  return new MobilePushService(databaseService, pushConfiguration);
}
