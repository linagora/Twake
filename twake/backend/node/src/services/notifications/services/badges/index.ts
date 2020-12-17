import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { UserNotificationBadgeServiceAPI } from "../../api";
import { UserNotificationBadgeService } from "./service";

export function getService(databaseService: DatabaseServiceAPI): UserNotificationBadgeServiceAPI {
  return new UserNotificationBadgeService(databaseService);
}
