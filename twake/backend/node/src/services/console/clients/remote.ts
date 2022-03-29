import axios, { AxiosInstance } from "axios";
import { v1 as uuidv1 } from "uuid";
import { ConsoleServiceClient } from "../client-interface";
import {
  ConsoleCompany,
  ConsoleHookCompany,
  ConsoleHookUser,
  ConsoleOptions,
  CreateConsoleCompany,
  CreateConsoleUser,
  CreatedConsoleCompany,
  CreatedConsoleUser,
  UpdateConsoleUserRole,
  UpdatedConsoleUserRole,
} from "../types";

import User, { getInstance } from "../../user/entities/user";
import { ConsoleServiceAPI } from "../api";
import Company, {
  CompanySearchKey,
  getInstance as getCompanyInstance,
} from "../../user/entities/company";
import { CrudException } from "../../../core/platform/framework/api/crud-service";
import coalesce from "../../../utils/coalesce";
import { logger } from "../../../core/platform/framework/logger";
import _ from "lodash";
import { CompanyFeaturesEnum, CompanyLimitsEnum } from "../../user/web/types";
import gr from "../../global-resolver";
export class ConsoleRemoteClient implements ConsoleServiceClient {
  version: "1";
  client: AxiosInstance;

  private infos: ConsoleOptions;

  constructor(consoleInstance: ConsoleServiceAPI, private dryRun: boolean) {
    this.infos = consoleInstance.consoleOptions;
    this.client = axios.create({ baseURL: this.infos.url });
  }

  private auth() {
    return { username: this.infos.username, password: this.infos.password };
  }

  async addUserToCompany(
    company: ConsoleCompany,
    user: CreateConsoleUser,
  ): Promise<CreatedConsoleUser> {
    logger.info("Remote: addUserToCompany");

    if (this.dryRun) {
      return {
        _id: uuidv1(),
      };
    }

    if (user.skipInvite && user.name && user.email && user.password) {
      return this.client
        .post(`/api/companies/${company.code}/users`, user, {
          auth: this.auth(),
          headers: {
            "Content-Type": "application/json",
          },
          params: {
            skipInvite: user.skipInvite,
          },
        })
        .then(({ data }) => data);
    } else {
      const invitationData = {
        role: user.role,
        emails: [
          {
            email: user.email,
            role: user.role,
          },
        ],
        inviter: { email: user.inviterEmail },
      };

      const result = await this.client
        .post(`/api/companies/${company.code}/users/invitation`, invitationData, {
          auth: this.auth(),
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then(async ({ data, status }) => {
          //Fixme: When console solve https://gitlab.com/COMPANY_LINAGORA/software/saas/twake-console-account/-/issues/35
          //       and solve https://gitlab.com/COMPANY_LINAGORA/software/saas/twake-console-account/-/issues/36
          //       we can remove this fallback
          if ([200, 201].indexOf(status) >= 0) {
            return data;
          } else {
            return this.client
              .post(`/api/companies/${company.code}/users`, user, {
                auth: this.auth(),
                headers: {
                  "Content-Type": "application/json",
                },
                params: {
                  skipInvite: user.skipInvite,
                },
              })
              .then(({ data }) => data);
          }
        });

      return result;
    }
  }

  async updateUserRole(
    company: ConsoleCompany,
    user: UpdateConsoleUserRole,
  ): Promise<UpdatedConsoleUserRole> {
    logger.info("Remote: updateUserRole");

    if (this.dryRun) {
      return {
        id: user.id,
        role: user.role,
      };
    }

    const result = await this.client
      .put(
        `/api/companies/${company.code}/users/${user.id}`,
        { role: user.role },
        {
          auth: this.auth(),
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
      .then(({ data }) => data);

    return result;
  }

  async createCompany(company: CreateConsoleCompany): Promise<CreatedConsoleCompany> {
    logger.info("Remote: createCompany");

    if (this.dryRun) {
      return company;
    }

    const result = await this.client
      .post("/api/companies", company, {
        auth: this.auth(),
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(({ data }) => data);

    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addUserToTwake(user: CreateConsoleUser): Promise<User> {
    logger.info("Remote: addUserToTwake");
    //should do noting for real console
    return Promise.resolve(undefined);
  }

  async updateLocalCompanyFromConsole(partialCompanyDTO: ConsoleHookCompany): Promise<Company> {
    logger.info("Remote: updateLocalCompanyFromConsole");

    const companyDTO = await this.fetchCompanyInfo(partialCompanyDTO.details.code);

    let company = await gr.services.companies.getCompany({
      identity_provider_id: companyDTO.details.code,
    });

    if (!company) {
      const newCompany = getCompanyInstance({
        id: uuidv1(),
        identity_provider: "console",
        identity_provider_id: companyDTO.details.code,
      });
      company = await gr.services.companies.createCompany(newCompany);
    }

    const details = companyDTO.details;

    if (details) {
      company.name = coalesce(details.name, company.name);
      company.displayName = coalesce(details.name, company.displayName);

      const avatar = details.avatar;

      company.logo =
        details.logo ||
        (avatar && avatar.type && avatar.type !== "url"
          ? this.infos.url.replace(/\/$/, "") + "/api/avatars/" + avatar.value
          : companyDTO.value || "");
    }

    if (!company.plan) {
      company.plan = { name: "", limits: undefined, features: undefined };
    }

    //FIXME this is a hack right now!
    let planFeatures: any = {
      [CompanyFeaturesEnum.CHAT_GUESTS]: true,
      [CompanyFeaturesEnum.CHAT_MESSAGE_HISTORY]: true,
      [CompanyFeaturesEnum.CHAT_MULTIPLE_WORKSPACES]: true,
      [CompanyFeaturesEnum.CHAT_EDIT_FILES]: true,
      [CompanyFeaturesEnum.CHAT_UNLIMITED_STORAGE]: true,
      [CompanyFeaturesEnum.COMPANY_INVITE_MEMBER]: true,
    };

    if (companyDTO.limits.members < 0 && this.infos.type === "remote") {
      //Hack to say this is free version
      planFeatures = {
        [CompanyFeaturesEnum.CHAT_GUESTS]: false,
        [CompanyFeaturesEnum.CHAT_MESSAGE_HISTORY]: false,
        [CompanyFeaturesEnum.CHAT_MULTIPLE_WORKSPACES]: false,
        [CompanyFeaturesEnum.CHAT_EDIT_FILES]: false,
        [CompanyFeaturesEnum.CHAT_UNLIMITED_STORAGE]: false, // Currently inactive
      };
      company.plan.name = "free";
    } else {
      company.plan.name = "standard";
    }
    company.plan.features = { ...planFeatures };
    company.plan.limits = {
      [CompanyLimitsEnum.CHAT_MESSAGE_HISTORY_LIMIT]: 10000, // To remove duplicata since we define this in formatCompany function
      [CompanyLimitsEnum.COMPANY_MEMBERS_LIMIT]: companyDTO.limits["members"],
    };

    company.stats = coalesce(companyDTO.stats, company.stats);

    await gr.services.companies.updateCompany(company);

    return company;
  }

  async updateLocalUserFromConsole(code: string): Promise<User> {
    logger.info("Remote: updateLocalUserFromConsole");

    const userDTO = await this.fetchUserInfo(code);

    if (!userDTO) {
      throw CrudException.badRequest("User not found on Console");
    }

    const roles = userDTO.roles;

    let user = await gr.services.users.getByConsoleId(userDTO._id);

    if (!user) {
      if (!userDTO.email) {
        throw CrudException.badRequest("Email is required");
      }

      let username = userDTO.email
        .split("@")[0]
        .toLocaleLowerCase()
        .replace(/[^a-zA-Z0-9]/g, "")
        .replace(/ +/g, "_");

      if (await gr.services.users.isEmailAlreadyInUse(userDTO.email)) {
        throw CrudException.badRequest("Console user not created because email already exists");
      }

      username = await gr.services.users.getAvailableUsername(username);
      if (!username) {
        throw CrudException.badRequest("Console user not created because username already exists");
      }

      user = getInstance({});
      user.username_canonical = (username || "").toLocaleLowerCase();
      user.email_canonical = userDTO.email;
      user.deleted = false;
    }

    user.email_canonical = coalesce(userDTO.email, user.email_canonical);
    user.phone = "";
    user.first_name = coalesce(userDTO.name, user.first_name);
    user.last_name = coalesce(userDTO.surname, user.last_name);
    user.identity_provider = "console";
    user.identity_provider_id = userDTO._id;
    user.mail_verified = coalesce(userDTO.isVerified, user.mail_verified);
    if (userDTO.preference) {
      user.preferences = user.preferences || {};
      user.preferences.allow_tracking = coalesce(
        userDTO.preference.allowTrackingPersonalInfo,
        user.preferences?.allow_tracking,
      );
      user.preferences.language = coalesce(userDTO.preference.locale, user.preferences?.language);
      user.preferences.timezone = coalesce(userDTO.preference.timeZone, user.preferences?.timezone);
    }

    const avatar = userDTO.avatar;

    user.picture =
      avatar && avatar.type && avatar.type !== "url"
        ? this.infos.url.replace(/\/$/, "") + "/api/avatars/" + avatar.value
        : "";

    await gr.services.users.save(user);

    const getCompanyByCode = async (companyCode: string) => {
      let company = await gr.services.companies.getCompany({
        identity_provider_id: companyCode,
      });
      if (!company) {
        const companyDTO = await this.fetchCompanyInfo(companyCode);
        await this.updateLocalCompanyFromConsole(companyDTO);
        company = await gr.services.companies.getCompany({
          identity_provider_id: companyCode,
        });
      }
      return company;
    };

    const companies = [];
    if (userDTO.roles) {
      for (const role of roles) {
        const companyConsoleCode = role.targetCode;
        const roleName = role.roleCode;
        const company = await getCompanyByCode(companyConsoleCode);
        if (!company) {
          throw CrudException.notFound(`Company ${companyConsoleCode} not found`);
        }
        //Make sure user is active, if not we remove it
        if (role.status !== "deactivated") {
          companies.push(company);
          await gr.services.companies.setUserRole(company.id, user.id, roleName);
        }
      }
    }

    // Remove user from companies not in the console
    const currentCompanies = await gr.services.companies.getAllForUser(user.id);
    for (const company of currentCompanies) {
      if (!companies.map(c => c.id).includes(company.group_id)) {
        await gr.services.companies.removeUserFromCompany(
          { id: company.group_id },
          { id: user.id },
        );
      }
    }

    await gr.services.users.save(user, {}, { user: { id: user.id, server_request: true } });

    return user;
  }

  async removeCompanyUser(consoleUserId: string, company: Company): Promise<void> {
    logger.info("Remote: removeCompanyUser");

    const user = await gr.services.users.getByConsoleId(consoleUserId);
    if (!user) {
      throw CrudException.notFound(`User ${consoleUserId} doesn't exists`);
    }
    await gr.services.companies.removeUserFromCompany({ id: company.id }, { id: user.id });
  }

  async removeUser(consoleUserId: string): Promise<void> {
    logger.info("Remote: removeUser");

    const user = await gr.services.users.getByConsoleId(consoleUserId);

    if (!user) {
      throw new Error("User does not exists on Twake.");
    }

    await gr.services.users.anonymizeAndDelete(
      { id: user.id },
      {
        user: { id: user.id, server_request: true },
      },
    );
  }

  async removeCompany(companySearchKey: CompanySearchKey): Promise<void> {
    logger.info("Remote: removeCompany");
    await gr.services.companies.removeCompany(companySearchKey);
  }

  fetchCompanyInfo(consoleCompanyCode: string): Promise<ConsoleHookCompany> {
    logger.info(`Remote: fetchCompanyInfo ${consoleCompanyCode}`);
    return this.client
      .get(`/api/companies/${consoleCompanyCode}`, {
        auth: this.auth(),
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(({ data }) => data.company)
      .catch(e => {
        if (e.response.status === 401) {
          throw CrudException.forbidden("Bad console credentials");
        }
        throw e;
      });
  }

  fetchUserInfo(consoleUserId: string): Promise<ConsoleHookUser> {
    logger.info(`Remote: fetchUserInfo ${consoleUserId}`);
    return this.client
      .get(`/api/users/${consoleUserId}`, {
        auth: this.auth(),
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(({ data }) => data)
      .catch(e => {
        if (e.response.status === 401) {
          throw CrudException.forbidden("Bad console credentials");
        }
        throw e;
      });
  }

  getUserByAccessToken(accessToken: string): Promise<ConsoleHookUser> {
    logger.info("Remote: getUserByAccessToken");
    return this.client
      .get("/api/users/profile", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then(({ data }) => data)
      .catch(e => {
        if (e.response?.status === 401) {
          throw CrudException.forbidden("Bad access token credentials");
        }
        throw e;
      });
  }

  async resendVerificationEmail(email: string) {
    logger.info("Remote: resendVerificationEmail");
    return this.client
      .post(
        "/api/users/resend-verification-email",
        {
          email,
        },
        {
          auth: this.auth(),
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
      .then(({ data }) => data)
      .catch(e => {
        if (e.response.status === 401) {
          throw CrudException.forbidden("Bad credentials");
        }
        throw e;
      });
  }
}
