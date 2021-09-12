import { CompanyApplicationServiceAPI, MarketplaceApplicationServiceAPI } from "../api";
import Application, { ApplicationPrimaryKey } from "../entities/application";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { logger } from "../../../core/platform/framework";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";
import {
  CreateResult,
  DeleteResult,
  ListResult,
  Paginable,
  SaveResult,
  UpdateResult,
} from "../../../core/platform/framework/api/crud-service";
import { CompanyExecutionContext } from "../web/types";

export function getService(
  platformService: PlatformServicesAPI,
  applicationService: MarketplaceApplicationServiceAPI,
): CompanyApplicationServiceAPI {
  return new CompanyApplicationService(platformService, applicationService);
}

class CompanyApplicationService implements CompanyApplicationServiceAPI {
  version: "1";
  repository: Repository<Application>;

  constructor(
    readonly platformService: PlatformServicesAPI,
    readonly applicationService: MarketplaceApplicationServiceAPI,
  ) {}

  async init(): Promise<this> {
    try {
      this.repository = await this.platformService.database.getRepository<Application>(
        "applications",
        Application,
      );
    } catch (err) {
      logger.error("Error while initializing applications service", err);
    }
    return this;
  }

  create?(
    item: Application,
    context?: CompanyExecutionContext,
  ): Promise<CreateResult<Application>> {
    throw new Error("Method not implemented.");
  }
  get(pk: ApplicationPrimaryKey, context?: CompanyExecutionContext): Promise<Application> {
    throw new Error("Method not implemented.");
  }
  update?(
    pk: ApplicationPrimaryKey,
    item: Application,
    context?: CompanyExecutionContext,
  ): Promise<UpdateResult<Application>> {
    throw new Error("Method not implemented.");
  }
  save?<SaveOptions>(
    item: Application,
    options?: SaveOptions,
    context?: CompanyExecutionContext,
  ): Promise<SaveResult<Application>> {
    throw new Error("Method not implemented.");
  }
  delete(
    pk: ApplicationPrimaryKey,
    context?: CompanyExecutionContext,
  ): Promise<DeleteResult<Application>> {
    throw new Error("Method not implemented.");
  }
  list<ListOptions>(
    pagination: Paginable,
    options?: ListOptions,
    context?: CompanyExecutionContext,
  ): Promise<ListResult<Application>> {
    throw new Error("Method not implemented.");
  }
}
