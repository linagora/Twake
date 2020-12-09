import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import {
  ChannelMemberPreferencesServiceAPI,
  NotificationServiceAPI,
  UserNotificationBadgeServiceAPI,
} from "../api";
import { getService as getBadgeService } from "./badges";
import { getService as getPreferencesService } from "./preferences";

export function getService(databaseService: DatabaseServiceAPI): NotificationServiceAPI {
  return getServiceInstance(databaseService);
}

function getServiceInstance(databaseService: DatabaseServiceAPI): NotificationServiceAPI {
  return new Service(databaseService);
}

class Service implements NotificationServiceAPI {
  version: "1";
  badges: UserNotificationBadgeServiceAPI;
  channelPreferences: ChannelMemberPreferencesServiceAPI;

  constructor(databaseService: DatabaseServiceAPI) {
    this.badges = getBadgeService(databaseService);
    this.channelPreferences = getPreferencesService(databaseService);
  }

  async init(context: TwakeContext): Promise<this> {
    try {
      await Promise.all([this.badges.init(context), this.channelPreferences.init(context)]);
    } catch (err) {
      console.error("Error while initializing notification service", err);
    }
    return this;
  }
}
