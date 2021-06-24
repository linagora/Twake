import axios, { AxiosInstance } from "axios";
import { ConsoleServiceClient } from "../client-interface";
import {
  ConsoleCompany,
  CreateConsoleCompany,
  CreateConsoleUser,
  CreatedConsoleCompany,
  CreatedConsoleUser,
  UpdateConsoleUserRole,
  UpdatedConsoleUserRole,
} from "../types";

import { v1 as uuidv1 } from "uuid";
import User from "../../user/entities/user";

export class ConsoleInternalClient implements ConsoleServiceClient {
  version: "1";
  client: AxiosInstance;

  constructor(
    private infos: {
      url: string;
      client: string;
      secret: string;
    },
    private dryRun: boolean,
  ) {
    this.client = axios.create({ baseURL: infos.url });
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

    throw Error("ConsoleInternalClient.addUserToCompany is not implemented");
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

    throw Error("ConsoleInternalClient.updateUserRole is not implemented");
  }

  async createCompany(company: CreateConsoleCompany): Promise<CreatedConsoleCompany> {
    if (this.dryRun) {
      return company;
    }

    throw Error("ConsoleInternalClient.createCompany is not implemented");
  }

  addUserToTwake(user: CreateConsoleUser): Promise<User> {
    if (this.dryRun) {
      return Promise.resolve(new User());
    }

    throw Error("ConsoleInternalClient.addUserToTwake is not implemented");
  }
}
