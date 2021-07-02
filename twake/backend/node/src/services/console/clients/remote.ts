import axios, { AxiosInstance } from "axios";
import { ConsoleServiceClient } from "../client-interface";
import {
  ConsoleCompany,
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
import Company from "../../user/entities/company";
import { CrudExeption } from "../../../core/platform/framework/api/crud-service";
import { CompanyUserRole } from "../../user/web/types";

export class ConsoleRemoteClient implements ConsoleServiceClient {
  version: "1";
  client: AxiosInstance;

  private infos: ConsoleOptions;

  constructor(private consoleInstance: ConsoleServiceAPI, private dryRun: boolean) {
    this.infos = consoleInstance.consoleOptions;
    this.client = axios.create({ baseURL: this.infos.url });
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
        auth: {
          username: this.infos.client,
          password: this.infos.secret,
        },
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
          auth: {
            username: this.infos.client,
            password: this.infos.secret,
          },
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
        auth: {
          username: this.infos.client,
          password: this.infos.secret,
        },
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

  async updateLocalCompanyFromConsole(code: string): Promise<Company> {
    const company = await this.consoleInstance.services.userService.companies.getCompanyByCode(
      code,
    );
    if (!company) throw CrudExeption.notFound(`Company code ${code} not found`);

    // this.client
    //   .get(`/api/companies/${code}`, {
    //     auth: {
    //       username: this.infos.client,
    //       password: this.infos.secret,
    //     },
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //   })
    //   .then(({ data }) => data);

    // ToDo: implement fetch data
    return company;
  }

  async updateLocalUserFromConsole(
    consoleUserId: string,
    company: Company,
    userDTO: ConsoleHookUser,
  ): Promise<void> {
    const user = await this.consoleInstance.services.userService.users.getByConsoleId(
      consoleUserId,
    );

    if (!user) {
      // th
    }

    /*

        if(!$user){
            $this->updateUser($userId, $companyCode, $userDTO);
            $user = (new Utils($this->app))->getUser($userId);
        }
        if(!$company){
            $this->updateCompany($companyCode);
            $company = (new Utils($this->app))->getCompany($companyCode);
        }

        if(!$user || !$company){
            return [
                "success" => false
            ];
        }

        //Fixme, in the future there should be a better endpoint to get user role in a given company
        if(!$userDTO){
            $header = "Authorization: Basic " . $this->authB64;
            $response = $this->api->get(rtrim($this->endpoint, "/") . "/users/" . $userId, array(CURLOPT_HTTPHEADER => [$header]));
            $userDTO = json_decode($response->getContent(), 1);
        }
        $companyRole = null;
        foreach($userDTO["roles"] as $role){
            if($role["targetCode"] === $companyCode){
                $companyRole = $role;
            }
        }

        $result = (new ApplyUpdates($this->app))->addUser($user, $company, $companyRole);
     */
  }
}
