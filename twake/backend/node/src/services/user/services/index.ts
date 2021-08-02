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
import { getService as getWorkspaceService } from "../../workspaces/services/workspace";
import { WorkspaceServiceAPI } from "../../workspaces/api";
import { SearchServiceAPI } from "../../../core/platform/services/search/api";
import {
  CompanyObject,
  CompanyShort,
  CompanyUserObject,
  CompanyUserRole,
  CompanyUserStatus,
  UserObject,
} from "../web/types";
import Company from "../entities/company";
import User from "../entities/user";

export function getService(
  databaseService: DatabaseServiceAPI,
  searchService: SearchServiceAPI,
): UserServiceAPI {
  return new Service(databaseService, searchService);
}

class Service implements UserServiceAPI {
  version: "1";
  users: UsersServiceAPI;
  companies: CompaniesServiceAPI;
  external: UserExternalLinksServiceAPI;
  workspaces: WorkspaceServiceAPI;

  constructor(databaseService: DatabaseServiceAPI, searchService: SearchServiceAPI) {
    this.users = getUserService(databaseService, searchService);
    this.external = getExternalService(databaseService);
    this.companies = getCompanyService(databaseService);
    this.workspaces = getWorkspaceService(databaseService, this.users);
  }

  async init(context: TwakeContext): Promise<this> {
    try {
      await Promise.all([
        this.users.init(context),
        this.companies.init(context),
        this.external.init(context),
        this.workspaces.init(context),
      ]);
    } catch (err) {
      console.error("Error while initializing user service", err);
    }
    return this;
  }

  public async formatUser(user: User, includeCompanies: boolean = false): Promise<UserObject> {
    let resUser = {
      id: user.id,
      provider: user.identity_provider,
      provider_id: user.identity_provider_id,
      email: user.email_canonical,
      username: user.username_canonical,
      is_verified: Boolean(user.mail_verified),
      picture: user.picture,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: [user.first_name, user.last_name].join(" "),
      created_at: user.creation_date,
      deleted: Boolean(user.deleted),
      status: user.status_icon,
      last_activity: user.last_activity,
    } as UserObject;

    if (includeCompanies) {
      const userCompanies = await this.users.getUserCompanies({ id: user.id });

      const companies = await Promise.all(
        userCompanies.map(async uc => {
          const company = await this.companies.getCompany({ id: uc.group_id });
          return {
            role: uc.role as CompanyUserRole,
            status: "active" as CompanyUserStatus, // FIXME: with real status
            company: {
              id: uc.group_id,
              name: company.name,
              logo: company.logo,
            } as CompanyShort,
          } as CompanyUserObject;
        }),
      );

      resUser = {
        ...resUser,
        preference: {
          locale: user.preferences?.language || user.language,
          timezone: user.preferences?.timezone || user.timezone,
          allow_tracking: user.preferences?.allow_tracking || false,
        },

        companies,
      };
    }

    return resUser;
  }

  public formatCompany(
    companyEntity: Company,
    companyUserObject?: CompanyUserObject,
  ): CompanyObject {
    const res: CompanyObject = {
      id: companyEntity.id,
      name: companyEntity.name,
      logo: companyEntity.logo,
      plan: companyEntity.plan,
      stats: companyEntity.stats,
    };

    if (companyUserObject) {
      res.status = "active"; // FIXME: with real status
      res.role = companyUserObject.role;
    }

    return res;
  }
}
