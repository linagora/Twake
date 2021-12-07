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
import { CrudExeption } from "../../../core/platform/framework/api/crud-service";
import UserServiceAPI from "../../user/api";
import coalesce from "../../../utils/coalesce";
import { logger } from "../../../core/platform/framework/logger";
import _ from "lodash";

export class ConsoleRemoteClient implements ConsoleServiceClient {
  version: "1";
  client: AxiosInstance;

  private infos: ConsoleOptions;
  private userService: UserServiceAPI;

  constructor(consoleInstance: ConsoleServiceAPI, private dryRun: boolean) {
    this.infos = consoleInstance.consoleOptions;
    this.client = axios.create({ baseURL: this.infos.url });
    this.userService = consoleInstance.services.userService;
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

    if (user.skipInvite) {
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
        .then(({ data }) => data);

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

    let company = await this.userService.companies.getCompany({
      identity_provider_id: companyDTO.details.code,
    });

    if (!company) {
      const newCompany = getCompanyInstance({
        id: uuidv1(),
        identity_provider: "console",
        identity_provider_id: companyDTO.details.code,
      });
      company = await this.userService.companies.createCompany(newCompany);
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
      company.plan = { name: "", features: {} };
    }

    //FIXME this is a hack right now!
    let planFeatures: any = {
      "chat:guests": true,
      "chat:message_history": true,
      "chat:multiple_workspaces": true,
      "chat:edit_files": true,
      "chat:unlimited_storage": true,
    };
    if (companyDTO.limits.members < 0) {
      //Hack to say this is free version
      planFeatures = {
        "chat:guests": false,
        "chat:message_history": false,
        "chat:message_history_limit": 10000,
        "chat:multiple_workspaces": false,
        "chat:edit_files": false,
        "chat:unlimited_storage": false, //Currently inactive
      };
      company.plan.name = "free";
    } else {
      company.plan.name = "standard";
    }
    company.plan.features = { ...planFeatures, ...companyDTO.limits };

    company.stats = coalesce(companyDTO.stats, company.stats);

    await this.userService.companies.updateCompany(company);

    return company;
  }

  async updateLocalUserFromConsole(code: string): Promise<User> {
    logger.info("Remote: updateLocalUserFromConsole");

    const userDTO = await this.fetchUserInfo(code);

    if (!userDTO) {
      throw CrudExeption.badRequest("User not found on Console");
    }

    const roles = userDTO.roles;

    let user = await this.userService.users.getByConsoleId(userDTO._id);

    if (!user) {
      if (!userDTO.email) {
        throw CrudExeption.badRequest("Email is required");
      }

      let username = userDTO.email
        .split("@")[0]
        .toLocaleLowerCase()
        .replace(/[^a-zA-Z0-9]/g, "")
        .replace(/ +/g, "_");

      if (await this.userService.users.isEmailAlreadyInUse(userDTO.email)) {
        throw CrudExeption.badRequest("Console user not created because email already exists");
      }

      username = await this.userService.users.getAvailableUsername(username);
      if (!username) {
        throw CrudExeption.badRequest("Console user not created because username already exists");
      }

      user = getInstance({});
      user.username_canonical = username;
      user.email_canonical = userDTO.email;
      user.deleted = false;
    }

    user.email_canonical = coalesce(userDTO.email, user.email_canonical);
    user.phone = "";
    user.first_name = userDTO.firstName
      ? userDTO.firstName
      : coalesce(userDTO.name, user.first_name);
    user.last_name = coalesce(userDTO.lastName, user.last_name);
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

    await this.userService.users.save(user);

    const getCompanyByCode = async (companyCode: string) => {
      let company = await this.userService.companies.getCompany({
        identity_provider_id: companyCode,
      });
      if (!company) {
        const companyDTO = await this.fetchCompanyInfo(companyCode);
        await this.updateLocalCompanyFromConsole(companyDTO);
        company = await this.userService.companies.getCompany({
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
          throw CrudExeption.notFound(`Company ${companyConsoleCode} not found`);
        }
        //Make sure user is active, if not we remove it
        if (role.status !== "deactivated") {
          companies.push(company);
          await this.userService.companies.setUserRole(company.id, user.id, roleName);
        }
      }
    }

    // Remove user from companies not in the console
    const currentCompanies = await this.userService.companies.getAllForUser(user.id);
    for (const company of currentCompanies) {
      if (!companies.map(c => c.id).includes(company.group_id)) {
        await this.userService.companies.removeUserFromCompany(
          { id: company.group_id },
          { id: user.id },
        );
      }
    }

    // Update user cache with companies
    user.cache = Object.assign(user.cache || {}, {
      companies: _.uniq([...companies.map(c => c.id)]),
    });
    await this.userService.users.save(user, {}, { user: { id: user.id, server_request: true } });

    return user;
  }

  async removeCompanyUser(consoleUserId: string, company: Company): Promise<void> {
    logger.info("Remote: removeCompanyUser");

    const user = await this.userService.users.getByConsoleId(consoleUserId);
    if (!user) {
      throw CrudExeption.notFound(`User ${consoleUserId} doesn't exists`);
    }
    await this.userService.companies.removeUserFromCompany({ id: company.id }, { id: user.id });
  }

  async removeUser(consoleUserId: string): Promise<void> {
    logger.info("Remote: removeUser");

    const user = await this.userService.users.getByConsoleId(consoleUserId);

    if (!user) {
      throw new Error("User does not exists on Twake.");
    }

    await this.userService.users.anonymizeAndDelete(
      { id: user.id },
      {
        user: { id: user.id, server_request: true },
      },
    );
  }

  async removeCompany(companySearchKey: CompanySearchKey): Promise<void> {
    logger.info("Remote: removeCompany");
    await this.userService.companies.removeCompany(companySearchKey);
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
          throw CrudExeption.forbidden("Bad console credentials");
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
          throw CrudExeption.forbidden("Bad console credentials");
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
          throw CrudExeption.forbidden("Bad access token credentials");
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
          throw CrudExeption.forbidden("Bad credentials");
        }
        throw e;
      });
  }
}
