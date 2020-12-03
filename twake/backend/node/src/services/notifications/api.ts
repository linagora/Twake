import { CRUDService } from "../../core/platform/framework/api/crud-service";
import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";
import { UserNotificationBadge, UserNotificationBadgePrimaryKey } from "./entities";
import { NotificationExecutionContext } from "./types";

export interface NotificationServiceAPI extends TwakeServiceProvider, Initializable {
  badges: UserNotificationBadgeServiceAPI;
}

export interface UserNotificationBadgeServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<
      UserNotificationBadge,
      UserNotificationBadgePrimaryKey,
      NotificationExecutionContext
    > {}
