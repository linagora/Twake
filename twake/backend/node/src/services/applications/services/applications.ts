import Application, {
  ApplicationPrimaryKey,
  getInstance as getApplicationInstance,
  PublicApplicationObject,
  TYPE,
} from "../entities/application";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { Initializable, logger, TwakeServiceProvider } from "../../../core/platform/framework";
import {
  DeleteResult,
  ExecutionContext,
  ListResult,
  OperationType,
  Pagination,
  SaveResult,
} from "../../../core/platform/framework/api/crud-service";
import SearchRepository from "../../../core/platform/services/search/repository";
import assert from "assert";

import gr from "../../global-resolver";
import { InternalToHooksProcessor } from "./internal-event-to-hooks";

export class ApplicationServiceImpl implements TwakeServiceProvider, Initializable {
  version: "1";
  repository: Repository<Application>;
  searchRepository: SearchRepository<Application>;

  async init(): Promise<this> {
    try {
      this.searchRepository = gr.platformServices.search.getRepository<Application>(
        TYPE,
        Application,
      );
      this.repository = await gr.database.getRepository<Application>(TYPE, Application);
    } catch (err) {
      console.log(err);
      logger.error("Error while initializing applications service");
    }

    gr.platformServices.pubsub.processor.addHandler(new InternalToHooksProcessor());

    return this;
  }

  async get(pk: ApplicationPrimaryKey, context?: ExecutionContext): Promise<Application> {
    return await this.repository.findOne(pk);
  }

  async list<ListOptions>(
    pagination: Pagination,
    options?: { search?: string },
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

  async listDefaults<ListOptions>(): Promise<ListResult<PublicApplicationObject>> {
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

  async delete(
    pk: ApplicationPrimaryKey,
    context?: ExecutionContext,
  ): Promise<DeleteResult<Application>> {
    const entity = await this.get(pk);
    await this.repository.remove(entity);
    return new DeleteResult<Application>("application", entity, true);
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
