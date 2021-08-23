import axios, { AxiosInstance } from "axios";
import { merge } from "lodash";

import { ConsoleServiceClient } from "../client-interface";
import {
  ConsoleCompany,
  ConsoleHookCompany,
  ConsoleHookUser,
  ConsoleOptions,
  ConsoleUser,
  CreateConsoleCompany,
  CreateConsoleUser,
  CreatedConsoleCompany,
  CreatedConsoleUser,
  UpdateConsoleUserRole,
  UpdatedConsoleUserRole,
} from "../types";

import { v1 as uuidv1 } from "uuid";
import { ConsoleServiceAPI } from "../api";
import User, { getInstance as getUserInstance } from "../../user/entities/user";
import Company, { CompanySearchKey } from "../../user/entities/company";
import { CompanyUserRole } from "../../user/web/types";

export class ConsoleInternalClient implements ConsoleServiceClient {
  version: "1";
  client: AxiosInstance;

  constructor(private consoleInstance: ConsoleServiceAPI) {}

  async addUserToCompany(
    company: ConsoleCompany,
    user: CreateConsoleUser,
  ): Promise<CreatedConsoleUser> {
    await this.consoleInstance.services.userService.companies.setUserRole(
      company.id,
      user.id,
      user.role,
    );
    return merge(user, { _id: user.id });
  }

  async updateUserRole(
    company: ConsoleCompany,
    user: UpdateConsoleUserRole,
  ): Promise<UpdatedConsoleUserRole> {
    throw Error("ConsoleInternalClient.updateUserRole is not implemented");
  }

  async createCompany(company: CreateConsoleCompany): Promise<CreatedConsoleCompany> {
    throw Error("ConsoleInternalClient.createCompany is not implemented");
  }

  async addUserToTwake(user: CreateConsoleUser): Promise<User> {
    const usersApi = this.consoleInstance.services.userService.users;
    const userToCreate = getUserInstance({
      id: uuidv1(),
      email_canonical: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      creation_date: Date.now(),
    });

    const createdUser = await usersApi.save(userToCreate).then(result => result.entity);
    if (user.password) {
      await usersApi.setPassword({ id: createdUser.id }, user.password);
    }
    return createdUser;
  }

  updateLocalCompanyFromConsole(companyDTO: ConsoleHookCompany): Promise<Company> {
    throw new Error("Method should not be implemented.");
  }

  updateLocalUserFromConsole(userDTO: ConsoleHookUser): Promise<User> {
    throw new Error("Method should not be implemented.");
  }

  removeCompany(companySearchKey: CompanySearchKey): Promise<void> {
    throw new Error("Method should not be implemented.");
  }

  removeCompanyUser(consoleUserId: string, company: Company): Promise<void> {
    throw new Error("Method should not be implemented.");
  }

  removeUser(consoleUserId: string): Promise<void> {
    throw new Error("Method should not be implemented.");
  }

  fetchCompanyInfo(consoleCompanyCode: string): Promise<ConsoleHookCompany> {
    throw new Error("Method should not be implemented.");
  }

  getUserByAccessToken(accessToken: string): Promise<ConsoleHookUser> {
    throw new Error("Method should not be implemented.");
  }

  resendVerificationEmail(accessToken: string): Promise<void> {
    throw new Error("Method should not be implemented.");
  }
}
