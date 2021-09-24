import { Multipart } from "fastify-multipart";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { MarketplaceApplicationServiceAPI } from "../api";
import StorageAPI from "../../../core/platform/services/storage/provider";
import Application, {
  ApplicationPrimaryKey,
  TYPE,
  PublicApplication,
} from "../entities/application";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { logger } from "../../../core/platform/framework";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";
import {
  CreateResult,
  DeleteResult,
  ExecutionContext,
  ListResult,
  Pagination,
  SaveResult,
  UpdateResult,
} from "../../../core/platform/framework/api/crud-service";

export function getService(platformService: PlatformServicesAPI): MarketplaceApplicationServiceAPI {
  return new ApplicationService(platformService);
}

class ApplicationService implements MarketplaceApplicationServiceAPI {
  version: "1";
  repository: Repository<Application>;

  constructor(readonly platformService: PlatformServicesAPI) {}

  async init(): Promise<this> {
    try {
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

  async get(pk: ApplicationPrimaryKey, context?: ExecutionContext): Promise<PublicApplication> {
    const entity = await this.repository.findOne(pk);
    return entity.getPublicObject();
  }

  async list<ListOptions>(
    pagination: Pagination,
    options?: ListOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<PublicApplication>> {
    //Todo: add search

    const entities = await this.repository.find({ pagination }, { pagination });
    entities.filterEntities(app => app.publication.published);

    const applications = entities.getEntities().map(app => app.getPublicObject());
    return new ListResult(entities.type, applications, entities.nextPage);
  }

  async listDefaults<ListOptions>(
    pagination: Pagination,
    options?: ListOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<PublicApplication>> {
    //Fixme: this is not great if we have a lot of applications in the future

    const entities = [];

    let page: Pagination = { limitStr: "100" };
    do {
      const applicationListResult = await this.repository.find({}, { pagination: page });
      page = applicationListResult.nextPage as Pagination;
      applicationListResult.filterEntities(app => app.publication.published && app.is_default);

      for (const application of applicationListResult.getEntities()) {
        entities.push(application.getPublicObject());
      }
    } while (page.page_token);

    return new ListResult(TYPE, entities);
  }

  create?(item: Application, context?: ExecutionContext): Promise<CreateResult<Application>> {
    throw new Error("Method not implemented.");
  }
  update?(
    pk: ApplicationPrimaryKey,
    item: Application,
    context?: ExecutionContext,
  ): Promise<UpdateResult<Application>> {
    throw new Error("Method not implemented.");
  }
  save?<SaveOptions>(
    item: Application,
    options?: SaveOptions,
    context?: ExecutionContext,
  ): Promise<SaveResult<Application>> {
    throw new Error("Method not implemented.");
  }
  delete(
    pk: ApplicationPrimaryKey,
    context?: ExecutionContext,
  ): Promise<DeleteResult<Application>> {
    throw new Error("Method not implemented.");
  }
}
