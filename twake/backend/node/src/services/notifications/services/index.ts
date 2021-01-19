import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import {
  ChannelMemberPreferencesServiceAPI,
  ChannelThreadUsersServiceAPI,
  NotificationServiceAPI,
  UserNotificationBadgeServiceAPI,
} from "../api";
import { getService as getBadgeService } from "./badges";
import { getService as getPreferencesService } from "./preferences";
import { getService as getChannelThreadsService } from "./channel-thread-users";
import { NotificationEngine } from "./engine";

export function getService(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
): NotificationServiceAPI {
  return getServiceInstance(databaseService, pubsub);
}

function getServiceInstance(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
): NotificationServiceAPI {
  return new Service(databaseService, pubsub);
}

class Service implements NotificationServiceAPI {
  version: "1";
  badges: UserNotificationBadgeServiceAPI;
  channelPreferences: ChannelMemberPreferencesServiceAPI;
  engine: NotificationEngine;
  channelThreads: ChannelThreadUsersServiceAPI;

  constructor(databaseService: DatabaseServiceAPI, pubsub: PubsubServiceAPI) {
    this.badges = getBadgeService(databaseService);
    this.channelPreferences = getPreferencesService(databaseService);
    this.channelThreads = getChannelThreadsService(databaseService);
    this.engine = new NotificationEngine(this, pubsub);
  }

  async init(context: TwakeContext): Promise<this> {
    try {
      await Promise.all([
        this.badges.init(context),
        this.channelPreferences.init(context),
        this.channelThreads.init(context),
        this.engine.init(),
      ]);
    } catch (err) {
      console.error("Error while initializing notification service", err);
    }
    return this;
  }
}
