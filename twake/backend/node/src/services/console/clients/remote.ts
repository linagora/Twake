import axios, { AxiosInstance } from "axios";
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

import { v1 as uuidv1 } from "uuid";
import User from "../../user/entities/user";
import { ConsoleServiceAPI } from "../api";
import Company, {
  CompanyPrimaryKey,
  CompanySearchKey,
  getInstance as getCompanyInstance,
} from "../../user/entities/company";
import { CrudExeption } from "../../../core/platform/framework/api/crud-service";
import { memoize } from "lodash";
import UserServiceAPI from "../../user/api";
import { ExternalGroupPrimaryKey } from "../../user/entities/external_company";
import coalesce from "../../../utils/coalesce";

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
    if (this.dryRun) {
      return {
        _id: uuidv1(),
      };
    }

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

  async updateUserRole(
    company: ConsoleCompany,
    user: UpdateConsoleUserRole,
  ): Promise<UpdatedConsoleUserRole> {
    if (this.dryRun) {
      return {
        id: user.id,
        role: user.role,
      };
    }

    return this.client
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
  }

  async createCompany(company: CreateConsoleCompany): Promise<CreatedConsoleCompany> {
    if (this.dryRun) {
      return company;
    }

    return this.client
      .post("/api/companies", company, {
        auth: this.auth(),
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(({ data }) => data);
  }

  addUserToTwake(user: CreateConsoleUser): Promise<User> {
    //should do noting for real console
    return Promise.resolve(undefined);
  }

  async updateLocalCompanyFromConsole(companyDTO: ConsoleHookCompany): Promise<Company> {
    let company = await this.userService.companies.getCompany({
      identity_provider_id: companyDTO.code,
    });

    if (!company) {
      const newCompany = getCompanyInstance({
        id: uuidv1(),
        identity_provider: "console",
        identity_provider_id: companyDTO.code,
      });
      company = await this.userService.companies.createCompany(newCompany);
    }

    if (companyDTO.details) {
      company.name = coalesce(companyDTO.details.name, company.name);
      company.displayName = coalesce(companyDTO.details.name, company.displayName);

      const avatar = companyDTO.details.avatar;

      company.logo =
        companyDTO.details.logo ||
        (avatar.type && avatar.type !== "url"
          ? this.infos.url.replace(/\/$/, "") + "/avatars/" + avatar.value
          : companyDTO.value || "");
    }

    company.plan = companyDTO.plan;
    company.stats = coalesce(companyDTO.stats, company.stats);

    await this.userService.companies.updateCompany(company);

    return company;
  }

  async updateLocalUserFromConsole(consoleUserId: string, userDTO: ConsoleHookUser): Promise<User> {
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

      user = new User();
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
      user.language = coalesce(userDTO.preference.locale, user.language);
      user.timezone = coalesce(userDTO.preference.timeZone, user.timezone);
    }

    const avatar = userDTO.avatar;

    user.picture =
      avatar && avatar.type && avatar.type !== "url"
        ? this.infos.url.replace(/\/$/, "") + "/avatars/" + avatar.value
        : "";

    await this.userService.users.save(user);

    const getCompanyByCode = memoize(companyCode =>
      this.userService.companies.getCompany({ identity_provider_id: companyCode }),
    );

    if (userDTO.roles) {
      for (const role of roles) {
        const companyConsoleCode = role.targetCode;
        const roleName = role.roleCode;
        const company = await getCompanyByCode(companyConsoleCode);
        if (!company) {
          throw CrudExeption.notFound(`Company ${companyConsoleCode} not found`);
        }
        await this.userService.companies.setUserRole(company.id, user.id, roleName);
        // await services.companies.setUserRole(company.id, user.id, roleName);
      }
    }

    return user;
  }

  async removeCompanyUser(consoleUserId: string, company: Company): Promise<void> {
    const user = await this.userService.users.getByConsoleId(consoleUserId);
    if (!user) {
      throw CrudExeption.notFound(`User ${consoleUserId} doesn't exists`);
    }
    await this.userService.companies.removeUserFromCompany({ id: company.id }, { id: user.id });
  }

  async removeCompany(companySearchKey: CompanySearchKey): Promise<void> {
    await this.userService.companies.removeCompany(companySearchKey);
  }

  fetchCompanyInfo(consoleCompanyCode: string): Promise<ConsoleHookCompany> {
    return this.client
      .get(`/api/companies/${consoleCompanyCode}`, {
        auth: this.auth(),
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(({ data }) => data);
  }
}
