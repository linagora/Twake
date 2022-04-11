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
}
