import UserServiceAPI from "../../../../services/user/api";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { UserNotificationBadgeServiceAPI } from "../../api";
import { UserNotificationBadgeService } from "./service";
import ChannelServiceAPI from "../../../../services/channels/provider";

export function getService(
  databaseService: DatabaseServiceAPI,
  userService: UserServiceAPI,
  channelsService: ChannelServiceAPI,
): UserNotificationBadgeServiceAPI {
  return new UserNotificationBadgeService(databaseService, userService, channelsService);
}
