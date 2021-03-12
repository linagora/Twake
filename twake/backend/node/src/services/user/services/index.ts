import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import UserServiceAPI, {
  CompaniesServiceAPI,
  UserExternalLinksServiceAPI,
  UsersServiceAPI,
} from "../api";
import { getService as getUserService } from "./users";
import { getService as getCompanyService } from "./companies";
import { getService as getExternalService } from "./external_links";

export function getService(databaseService: DatabaseServiceAPI): UserServiceAPI {
  return new Service(databaseService);
}

class Service implements UserServiceAPI {
  version: "1";
  users: UsersServiceAPI;
  companies: CompaniesServiceAPI;
  external: UserExternalLinksServiceAPI;

  constructor(databaseService: DatabaseServiceAPI) {
    this.users = getUserService(databaseService);
    this.external = getExternalService(databaseService);
    this.companies = getCompanyService(databaseService, this);
  }

  async init(context: TwakeContext): Promise<this> {
    try {
      await Promise.all([
        this.users.init(context),
        this.companies.init(context),
        this.external.init(context),
      ]);
    } catch (err) {
      console.error("Error while initializing notification service", err);
    }
    return this;
  }
}
