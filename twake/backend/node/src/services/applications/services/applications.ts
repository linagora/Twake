import { MarketplaceApplicationServiceAPI } from "../api";
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
import { localEventBus } from "../../../core/platform/framework/pubsub";
import {
  RealtimeApplicationEvent,
  RealtimeBaseBusEvent,
  RealtimeEntityActionType,
  RealtimeEntityEvent,
  RealtimeLocalBusEvent,
  ResourcePath,
} from "../../../core/platform/services/realtime/types";
import { getThreadMessagePath } from "../../messages/web/realtime";
import { ThreadExecutionContext } from "../../messages/types";
import { Message } from "../../messages/entities/messages";
import { eventBus } from "../../../core/platform/services/realtime/bus";
import { getNotificationRoomName } from "../../notifications/services/realtime";
import { v1 as uuid } from "uuid";

export function getService(platformService: PlatformServicesAPI): MarketplaceApplicationServiceAPI {
  return new ApplicationService(platformService);
}

class ApplicationService implements MarketplaceApplicationServiceAPI {
  version: "1";
  repository: Repository<Application>;
  searchRepository: SearchRepository<Application>;

  constructor(readonly platformService: PlatformServicesAPI) {}

  async init(): Promise<this> {
    try {
      this.searchRepository = this.platformService.search.getRepository<Application>(
        TYPE,
        Application,
      );
      this.repository = await this.platformService.database.getRepository<Application>(
        TYPE,
        Application,
      );
    } catch (err) {
      console.log(err);
      logger.error("Error while initializing applications service");
    }
    return this;
  }

  async get(pk: ApplicationPrimaryKey, context?: ExecutionContext): Promise<Application> {
    return await this.repository.findOne(pk);
  }

  async list<ListOptions>(
    pagination: Pagination,
    options?: { search?: string },
    context?: ExecutionContext,
  ): Promise<ListResult<PublicApplicationObject>> {
    let entities: ListResult<Application>;
    if (options.search) {
      entities = await this.searchRepository.search(
        {},
        {
          pagination,
          $text: {
            $search: options.search,
          },
        },
      );
    } else {
      entities = await this.repository.find({}, { pagination });
    }
    entities.filterEntities(app => app.publication.published);

    const applications = entities
      .getEntities()
      .filter(app => app)
      .map(app => app.getPublicObject());
    return new ListResult(entities.type, applications, entities.nextPage);
  }

  async listUnpublished(): Promise<Application[]> {
    const entities = await this.repository.find({}, {});
    entities.filterEntities(app => !app.publication.published);
    return entities.getEntities();
  }

  async listDefaults<ListOptions>(
    pagination: Pagination,
    options?: ListOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<PublicApplicationObject>> {
    //Fixme: this is not great if we have a lot of applications in the future

    const entities = [];

    let page: Pagination = { limitStr: "100" };
    do {
      const applicationListResult = await this.repository.find({}, { pagination: page });
      page = applicationListResult.nextPage as Pagination;
      applicationListResult.filterEntities(app => app.publication.published && app.is_default);

      for (const application of applicationListResult.getEntities()) {
        if (application) entities.push(application.getPublicObject());
      }
    } while (page.page_token);

    return new ListResult(TYPE, entities);
  }

  async save<SaveOptions>(
    item: Application,
    options?: SaveOptions,
    context?: ExecutionContext,
  ): Promise<SaveResult<Application>> {
    assert(item.company_id, "company_id is not defined");

    try {
      const entity = getApplicationInstance(item);
      await this.repository.save(entity);
      return new SaveResult<Application>("application", entity, OperationType.UPDATE);
    } catch (e) {
      throw e;
    }
  }
  delete(
    pk: ApplicationPrimaryKey,
    context?: ExecutionContext,
  ): Promise<DeleteResult<Application>> {
    throw new Error("Method not implemented.");
  }

  async publish(pk: ApplicationPrimaryKey): Promise<void> {
    const entity = await this.get(pk);
    if (!entity) {
      throw new Error("Entity not found");
    }
    entity.publication.published = true;
    await this.repository.save(entity);
  }

  async unpublish(pk: ApplicationPrimaryKey): Promise<void> {
    const entity = await this.get(pk);
    if (!entity) {
      throw new Error("Entity not found");
    }
    entity.publication.published = false;
    await this.repository.save(entity);
  }

  async notifyApp(application_id: string, type: string, name: string, content: any): Promise<void> {
    log.info({ application_id, type, name, content });

    const app = await this.get({ id: application_id });
    if (!app) {
      throw CrudException.notFound("Application not found");
    }

    if (!app.api.hooksUrl) {
      throw CrudException.badRequest("Application hooksUrl is not defined");
    }

    const payload = {
      type,
      name,
      content,
      connection_id: "123",
      user_id: "e5207cd0-786e-11ec-a485-a111926a997e",
    };

    const signature = crypto
      .createHmac("sha256", app.api.privateKey)
      .update(JSON.stringify(payload))
      .digest("hex");

    const remoteData = await axios
      .post(app.api.hooksUrl, payload, {
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
