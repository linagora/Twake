import UserServiceAPI from "../../../../services/user/api";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { NotificationPreferencesService } from "./service";

export function getService(
  databaseService: DatabaseServiceAPI,
  userService: UserServiceAPI,
): NotificationPreferencesService {
  return new NotificationPreferencesService(databaseService, userService);
}
