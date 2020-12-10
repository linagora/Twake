import { CRUDService } from "../../core/platform/framework/api/crud-service";
import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";
import {
  ChannelMemberNotificationPreference,
  ChannelMemberNotificationPreferencePrimaryKey,
  UserNotificationBadge,
  UserNotificationBadgePrimaryKey,
} from "./entities";
import { NotificationExecutionContext } from "./types";
import { MessageNotification } from "../messages/types";

export interface NotificationServiceAPI extends TwakeServiceProvider, Initializable {
  badges: UserNotificationBadgeServiceAPI;
  channelPreferences: ChannelMemberPreferencesServiceAPI;
  engine: NotificationEngineAPI;
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

/**
 * The notificaiton engine processes messages and creates notifications.
 * Notifications are then published in notification transport to the clients.
 */
export interface NotificationEngineAPI extends Initializable {
  /**
   * Process the message and potentially produces several notifications
   * @param message
   */
  process(message: MessageNotification): void;
}
