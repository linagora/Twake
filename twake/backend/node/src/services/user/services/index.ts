import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import UserServiceAPI, { UsersServiceAPI } from "../api";
import { getService as getUserService } from "./users";

export function getService(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
): UserServiceAPI {
  return new Service(databaseService, pubsub);
}

class Service implements UserServiceAPI {
  version: "1";
  users: UsersServiceAPI;

  constructor(private databaseService: DatabaseServiceAPI, private pubsub: PubsubServiceAPI) {
    this.users = getUserService(databaseService);
  }

  async init(context: TwakeContext): Promise<this> {
    try {
      await Promise.all([
        this.users.init(context),
      ]);
    } catch (err) {
      console.error("Error while initializing notification service", err);
    }
    return this;
  }
}
