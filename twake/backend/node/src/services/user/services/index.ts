import { TwakeContext } from "../../../core/platform/framework";
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
import {
  CompanyFeaturesEnum,
  CompanyLimitsEnum,
  CompanyObject,
  CompanyShort,
  CompanyStatsObject,
  CompanyUserObject,
  CompanyUserRole,
  CompanyUserStatus,
  UserObject,
} from "../web/types";
import Company from "../entities/company";
import User from "../entities/user";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";
import { ApplicationServiceAPI } from "../../applications/api";
import { StatisticsAPI } from "../../statistics/types";
import AuthServiceAPI from "../../../core/platform/services/auth/provider";

export function getService(
  platformServices: PlatformServicesAPI,
  applications: ApplicationServiceAPI,
  statistics: StatisticsAPI,
  auth: AuthServiceAPI,
): UserServiceAPI {
  return new Service(platformServices, applications, statistics, auth);
}

class Service implements UserServiceAPI {
  version: "1";
  users: UsersServiceAPI;
  companies: CompaniesServiceAPI;
  external: UserExternalLinksServiceAPI;
  workspaces: WorkspaceServiceAPI;

  constructor(
    platformServices: PlatformServicesAPI,
    readonly applications: ApplicationServiceAPI,
    readonly statistics: StatisticsAPI,
    readonly auth: AuthServiceAPI,
  ) {
    this.users = getUserService(platformServices);
    this.external = getExternalService(platformServices.database);
    this.companies = getCompanyService(platformServices, this);
    this.workspaces = getWorkspaceService(
      platformServices,
      this.users,
      this.companies,
      this.applications,
      auth,
    );
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

  public async formatUser(
    user: User,
    options?: { includeCompanies?: boolean },
  ): Promise<UserObject> {
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

    if (options?.includeCompanies) {
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
          ...user.preferences,
          locale: user.preferences?.language || user.language || "en",
          timezone: user.preferences?.timezone || parseInt(user.timezone) || 0,
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
    companyStats?: CompanyStatsObject,
  ): CompanyObject {
    const res: CompanyObject = {
      id: companyEntity.id,
      name: companyEntity.name || "",
      logo: companyEntity.logo || "",
      plan: companyEntity.plan,
      identity_provider: companyEntity.identity_provider,
      identity_provider_id: companyEntity.identity_provider_id,
    };

    if (companyUserObject) {
      res.status = "active"; // FIXME: Deactivated console user are removed from company on twake side
      res.role = companyUserObject.role;
    }

    if (companyStats) {
      res.stats = companyStats;
    }

    res.plan = {
      name: res.plan?.name || "free",
      limits: res.plan?.limits || {},
      features: res.plan?.features || {},
    };

    res.plan.limits = Object.assign(
      {
        [CompanyLimitsEnum.CHAT_MESSAGE_HISTORY_LIMIT]: 10000,
        [CompanyLimitsEnum.COMPANY_MEMBERS_LIMIT]: -1,
      },
      res.plan?.limits || {},
    );

    res.plan.features = Object.assign(
      {
        [CompanyFeaturesEnum.CHAT_GUESTS]: true,
        [CompanyFeaturesEnum.CHAT_MESSAGE_HISTORY]: true,
        [CompanyFeaturesEnum.CHAT_MULTIPLE_WORKSPACES]: true,
        [CompanyFeaturesEnum.CHAT_EDIT_FILES]: true,
        [CompanyFeaturesEnum.CHAT_UNLIMITED_STORAGE]: true,
        [CompanyFeaturesEnum.COMPANY_INVITE_MEMBER]:
          res.plan?.limits[CompanyLimitsEnum.COMPANY_MEMBERS_LIMIT] <= 0 ||
          res.stats.total_members < res.plan?.limits[CompanyLimitsEnum.COMPANY_MEMBERS_LIMIT],
      },
      res.plan?.features || {},
    );

    return res;
  }
}
