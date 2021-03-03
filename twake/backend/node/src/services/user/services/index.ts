import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import UserServiceAPI, { CompaniesServiceAPI, UsersServiceAPI } from "../api";
import { getService as getUserService } from "./users";
import { getService as getCompanyService } from "./companies";

export function getService(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
): UserServiceAPI {
  return new Service(databaseService);
}

class Service implements UserServiceAPI {
  version: "1";
  users: UsersServiceAPI;
  companies: CompaniesServiceAPI;

  constructor(databaseService: DatabaseServiceAPI) {
    this.users = getUserService(databaseService);
    this.companies = getCompanyService(databaseService, this);
  }

  async init(context: TwakeContext): Promise<this> {
    try {
      await Promise.all([
        this.users.init(context),
        this.companies.init(context),
      ]);
    } catch (err) {
      console.error("Error while initializing notification service", err);
    }
    return this;
  }
}
