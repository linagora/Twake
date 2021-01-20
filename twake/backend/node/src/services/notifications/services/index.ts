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
import TrackerAPI from "../../../core/platform/services/tracker/provider";

export function getService(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
  tracker: TrackerAPI,
): NotificationServiceAPI {
  return getServiceInstance(databaseService, pubsub, tracker);
}

function getServiceInstance(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
  tracker: TrackerAPI,
): NotificationServiceAPI {
  return new Service(databaseService, pubsub, tracker);
}

class Service implements NotificationServiceAPI {
  version: "1";
  badges: UserNotificationBadgeServiceAPI;
  channelPreferences: ChannelMemberPreferencesServiceAPI;
  engine: NotificationEngine;
  channelThreads: ChannelThreadUsersServiceAPI;

  constructor(databaseService: DatabaseServiceAPI, pubsub: PubsubServiceAPI, tracker: TrackerAPI) {
    this.badges = getBadgeService(databaseService);
    this.channelPreferences = getPreferencesService(databaseService);
    this.channelThreads = getChannelThreadsService(databaseService);
    this.engine = new NotificationEngine(this, pubsub, tracker);
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
