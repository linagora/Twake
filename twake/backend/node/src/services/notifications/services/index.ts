import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import {
  ChannelMemberPreferencesServiceAPI,
  ChannelThreadUsersServiceAPI,
  NotificationEngineAPI,
  NotificationServiceAPI,
  UserNotificationBadgeServiceAPI,
} from "../api";
import { getService as getBadgeService } from "./badges";
import { getService as getPreferencesService } from "./preferences";
import { getService as getChannelThreadsService } from "./channel-thread-users";
import { NotificationEngine } from "./engine";

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
  engine: NotificationEngineAPI;
  channelThreads: ChannelThreadUsersServiceAPI;

  constructor(databaseService: DatabaseServiceAPI) {
    this.badges = getBadgeService(databaseService);
    this.channelPreferences = getPreferencesService(databaseService);
    this.channelThreads = getChannelThreadsService(databaseService);
    this.engine = new NotificationEngine(this);
  }

  async init(context: TwakeContext): Promise<this> {
    try {
      await Promise.all([
        this.badges.init(context),
        this.channelPreferences.init(context),
        this.engine.init(context),
      ]);
    } catch (err) {
      console.error("Error while initializing notification service", err);
    }
    return this;
  }
}
