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
import { getService as getMobilePushService } from "./mobile-push";
import { NotificationEngine } from "./engine";
import { NotificationPreferencesService } from "./preferences/service";
import UserServiceAPI from "../../../services/user/api";
import { MobilePushService } from "./mobile-push/service";
import { PushServiceAPI } from "../../../core/platform/services/push/api";

export function getService(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
  push: PushServiceAPI,
  userService: UserServiceAPI,
): NotificationServiceAPI {
  return getServiceInstance(databaseService, pubsub, push, userService);
}

function getServiceInstance(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
  push: PushServiceAPI,
  userService: UserServiceAPI,
): NotificationServiceAPI {
  return new Service(databaseService, pubsub, push, userService);
}

class Service implements NotificationServiceAPI {
  version: "1";
  badges: UserNotificationBadgeServiceAPI;
  channelPreferences: ChannelMemberPreferencesServiceAPI;
  engine: NotificationEngine;
  channelThreads: ChannelThreadUsersServiceAPI;
  notificationPreferences: NotificationPreferencesService;
  mobilePush: MobilePushService;

  constructor(
    databaseService: DatabaseServiceAPI,
    pubsub: PubsubServiceAPI,
    push: PushServiceAPI,
    userService: UserServiceAPI,
  ) {
    this.badges = getBadgeService(databaseService, userService);
    this.channelPreferences = getPreferencesService(databaseService);
    this.channelThreads = getChannelThreadsService(databaseService);
    this.notificationPreferences = getNotificationPreferencesService(databaseService, userService);
    this.mobilePush = getMobilePushService(databaseService, push);
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
        this.mobilePush.init(),
      ]);
    } catch (err) {
      console.error("Error while initializing notification service", err);
    }
    return this;
  }
}
