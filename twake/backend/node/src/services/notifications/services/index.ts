import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { NotificationServiceAPI, UserNotificationBadgeServiceAPI } from "../api";
import { getService as getBadgeService } from "./badges";

export function getService(databaseService: DatabaseServiceAPI): NotificationServiceAPI {
  return getServiceInstance(databaseService);
}

function getServiceInstance(databaseService: DatabaseServiceAPI): NotificationServiceAPI {
  return new Service(databaseService);
}

class Service implements NotificationServiceAPI {
  version: "1";
  badges: UserNotificationBadgeServiceAPI;

  constructor(databaseService: DatabaseServiceAPI) {
    this.badges = getBadgeService(databaseService);
  }

  async init(): Promise<this> {
    try {
      await Promise.all([this.badges.init()]);
    } catch (err) {
      console.error("Error while initializing notification service", err);
    }
    return this;
  }
}
