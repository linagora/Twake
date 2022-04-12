import { ApplicationHooksServiceAPI, MarketplaceApplicationServiceAPI } from "../api";
import Application, {
  ApplicationPrimaryKey,
  getInstance as getApplicationInstance,
  PublicApplicationObject,
  TYPE,
} from "../entities/application";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { logger } from "../../../core/platform/framework";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";
import {
  CreateResult,
  CrudException,
  DeleteResult,
  EntityOperationResult,
  ExecutionContext,
  ListResult,
  OperationType,
  Pagination,
  SaveResult,
  UpdateResult,
} from "../../../core/platform/framework/api/crud-service";
import SearchRepository from "../../../core/platform/services/search/repository";
import assert from "assert";
import { logger as log } from "../../../core/platform/framework";
import axios, { AxiosInstance, AxiosResponse } from "axios";
import * as crypto from "crypto";
import { isObject } from "lodash";

export class ApplicationHooksService implements ApplicationHooksServiceAPI {
  version: "1";
  repository: Repository<Application>;
  searchRepository: SearchRepository<Application>;

  constructor(
    readonly platformService: PlatformServicesAPI,
    readonly applicationService: MarketplaceApplicationServiceAPI,
  ) {}

  async init() {
    return this;
  }

  async notifyApp(
    application_id: string,
    connection_id: string,
    user_id: string,
    type: string,
    name: string,
    content: any,
    company_id: string,
    workspace_id: string,
  ): Promise<void> {
    const app = await this.applicationService.get({ id: application_id });
    if (!app) {
      throw CrudException.notFound("Application not found");
    }

    if (!app.api.hooks_url) {
      throw CrudException.badRequest("Application hooks_url is not defined");
    }

    const payload = {
      type,
      name,
      content,
      connection_id: connection_id,
      user_id: user_id,
      company_id,
      workspace_id,
    };

    const signature = crypto
      .createHmac("sha256", app.api.private_key)
      .update(JSON.stringify(payload))
      .digest("hex");

    return await axios
      .post(app.api.hooks_url, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-Twake-Signature": signature,
        },
      })

      .then(({ data }) => data)
      .catch(e => {
        log.error(e.message);
        const r = e.response;

        if (!r) {
          throw CrudException.badGateway("Can't connect remote application");
        }

        let msg = r.data;

        if (isObject(msg)) {
          // parse typical responses
          if (r.data.message) {
            msg = r.data.message;
          } else if (r.data.error) {
            msg = r.data.error;
          } else {
            msg = JSON.stringify(r.data);
          }
        }

        if (r.status == 403) {
          throw CrudException.forbidden(msg);
        } else {
          throw CrudException.badRequest(msg);
        }
      });
  }
}
