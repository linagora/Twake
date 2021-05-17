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
import { getService as getPreferencesService } from "./channel-preferences";
import { getService as getChannelThreadsService } from "./channel-thread-users";
import { getService as getNotificationPreferencesService } from "./preferences";
import { NotificationEngine } from "./engine";
import { NotificationPreferencesService } from "./preferences/service";
import UserServiceAPI from "../../../services/user/api";

export function getService(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
  userService: UserServiceAPI,
): NotificationServiceAPI {
  return getServiceInstance(databaseService, pubsub, userService);
}

function getServiceInstance(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
  userService: UserServiceAPI,
): NotificationServiceAPI {
  return new Service(databaseService, pubsub, userService);
}

class Service implements NotificationServiceAPI {
  version: "1";
  badges: UserNotificationBadgeServiceAPI;
  channelPreferences: ChannelMemberPreferencesServiceAPI;
  engine: NotificationEngine;
  channelThreads: ChannelThreadUsersServiceAPI;
  notificationPreferences: NotificationPreferencesService;

  constructor(
    databaseService: DatabaseServiceAPI,
    pubsub: PubsubServiceAPI,
    userService: UserServiceAPI,
  ) {
    this.badges = getBadgeService(databaseService, userService);
    this.channelPreferences = getPreferencesService(databaseService);
    this.channelThreads = getChannelThreadsService(databaseService);
    this.notificationPreferences = getNotificationPreferencesService(databaseService, userService);
    this.engine = new NotificationEngine(this, pubsub);
  }

  async init(context: TwakeContext): Promise<this> {
    try {
      await Promise.all([
        this.badges.init(context),
        this.channelPreferences.init(context),
        this.channelThreads.init(context),
        this.engine.init(),
        this.notificationPreferences.init(),
      ]);
    } catch (err) {
      console.error("Error while initializing notification service", err);
    }
    return this;
  }
}
