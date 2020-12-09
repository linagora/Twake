import { CRUDService } from "../../core/platform/framework/api/crud-service";
import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";
import {
  ChannelMemberNotificationPreference,
  ChannelMemberNotificationPreferencePrimaryKey,
  UserNotificationBadge,
  UserNotificationBadgePrimaryKey,
} from "./entities";
import { NotificationExecutionContext } from "./types";

export interface NotificationServiceAPI extends TwakeServiceProvider, Initializable {
  badges: UserNotificationBadgeServiceAPI;
  channelPreferences: ChannelMemberPreferencesServiceAPI;
}

export interface UserNotificationBadgeServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<
      UserNotificationBadge,
      UserNotificationBadgePrimaryKey,
      NotificationExecutionContext
    > {}

export interface ChannelMemberPreferencesServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<
      ChannelMemberNotificationPreference,
      ChannelMemberNotificationPreferencePrimaryKey,
      NotificationExecutionContext
    > {}
