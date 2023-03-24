import { AxiosInstance } from "axios";
import { merge } from "lodash";

import { ConsoleServiceClient } from "../client-interface";
import {
  ConsoleCompany,
  ConsoleHookCompany,
  ConsoleHookUser,
  CreateConsoleCompany,
  CreateConsoleUser,
  CreatedConsoleCompany,
  CreatedConsoleUser,
  UpdateConsoleUserRole,
  UpdatedConsoleUserRole,
} from "../types";

import { v1 as uuidv1 } from "uuid";
import User, { getInstance as getUserInstance } from "../../user/entities/user";
import Company, { CompanySearchKey } from "../../user/entities/company";
import { logger } from "../../../core/platform/framework/logger";
import gr from "../../global-resolver";
import { ConsoleServiceImpl } from "../service";

export class ConsoleInternalClient implements ConsoleServiceClient {
  version: "1";
  client: AxiosInstance;

  constructor(private consoleInstance: ConsoleServiceImpl) {}

  async addUserToCompany(
    company: ConsoleCompany,
    user: CreateConsoleUser,
  ): Promise<CreatedConsoleUser> {
    logger.info("Internal: addUserToCompany");
    await gr.services.companies.setUserRole(company.id, user.id, user.role);
    return merge(user, { _id: user.id });
  }

  async updateUserRole(
    company: ConsoleCompany,
    user: UpdateConsoleUserRole,
  ): Promise<UpdatedConsoleUserRole> {
    logger.info("Internal: updateUserRole");
    throw Error("ConsoleInternalClient.updateUserRole is not implemented");
  }

  async createCompany(company: CreateConsoleCompany): Promise<CreatedConsoleCompany> {
    logger.info("Internal: ");
    throw Error("ConsoleInternalClient.createCompany is not implemented");
  }

  async addUserToTwake(user: CreateConsoleUser): Promise<User> {
    logger.info("Internal: addUserToTwake");
    const userToCreate = getUserInstance({
      id: uuidv1(),
      email_canonical: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
    });

    const createdUser = await gr.services.users.save(userToCreate).then(result => result.entity);
    if (user.password) {
      await gr.services.users.setPassword({ id: createdUser.id }, user.password);
    }
    return createdUser;
  }

  updateLocalCompanyFromConsole(companyDTO: ConsoleHookCompany): Promise<Company> {
    logger.info("Internal: updateLocalCompanyFromConsole");
    throw new Error("Method should not be implemented.");
  }

  updateLocalUserFromConsole(code: string): Promise<User> {
    logger.info("Internal: updateLocalUserFromConsole");
    throw new Error("Method should not be implemented.");
  }

  removeCompany(companySearchKey: CompanySearchKey): Promise<void> {
    logger.info("Internal: removeCompany");
    throw new Error("Method should not be implemented.");
  }

  removeCompanyUser(consoleUserId: string, company: Company): Promise<void> {
    logger.info("Internal: removeCompanyUser");
    throw new Error("Method should not be implemented.");
  }

  removeUser(consoleUserId: string): Promise<void> {
    logger.info("Internal: removeUser");
    throw new Error("Method should not be implemented.");
  }

  fetchCompanyInfo(consoleCompanyCode: string): Promise<ConsoleHookCompany> {
    logger.info("Internal: fetchCompanyInfo");
    throw new Error("Method should not be implemented.");
  }

  getUserByAccessToken(accessToken: string): Promise<ConsoleHookUser> {
    logger.info("Internal: getUserByAccessToken");
    throw new Error("Method should not be implemented.");
  }

  resendVerificationEmail(accessToken: string): Promise<void> {
    logger.info("Internal: resendVerificationEmail");
    throw new Error("Method should not be implemented.");
  }
}
