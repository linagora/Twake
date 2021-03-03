import axios, { AxiosInstance } from "axios";
import { ConsoleServiceClient } from "./api";
import {
  ConsoleCompany,
  CreateConsoleCompany,
  CreateConsoleUser,
  CreatedConsoleCompany,
  CreatedConsoleUser,
  UpdateConsoleUserRole,
  UpdatedConsoleUserRole,
} from "./types";

export class ConsoleHTTPClient implements ConsoleServiceClient {
  version: "1";
  client: AxiosInstance;

  constructor(url: string, private dryRun: boolean) {
    this.client = axios.create({ baseURL: url });
  }

  async addUser(company: ConsoleCompany, user: CreateConsoleUser): Promise<CreatedConsoleUser> {
    if (this.dryRun) {
      return {
        _id: user.email,
      };
    }

    return this.client
      .post(`/api/companies/${company.code}/users`, user, {
        headers: {
          "Content-Type": "application/json",
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
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(({ data }) => data);
  }
}
