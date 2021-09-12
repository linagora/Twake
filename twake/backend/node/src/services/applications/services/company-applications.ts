import { CompanyApplicationServiceAPI, MarketplaceApplicationServiceAPI } from "../api";
import CompanyApplication, {
  TYPE,
  CompanyApplicationPrimaryKey,
  CompanyApplicationWithApplication,
} from "../entities/company-application";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { logger } from "../../../core/platform/framework";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";
import {
  CreateResult,
  DeleteResult,
  ListResult,
  OperationType,
  Paginable,
  SaveResult,
  UpdateResult,
} from "../../../core/platform/framework/api/crud-service";
import { CompanyExecutionContext } from "../web/types";
import Application, { ApplicationPrimaryKey } from "../entities/application";

export function getService(
  platformService: PlatformServicesAPI,
  applicationService: MarketplaceApplicationServiceAPI,
): CompanyApplicationServiceAPI {
  return new CompanyApplicationService(platformService, applicationService);
}

class CompanyApplicationService implements CompanyApplicationServiceAPI {
  version: "1";
  repository: Repository<CompanyApplication>;

  constructor(
    readonly platformService: PlatformServicesAPI,
    readonly applicationService: MarketplaceApplicationServiceAPI,
  ) {}

  async init(): Promise<this> {
    try {
      this.repository = await this.platformService.database.getRepository<CompanyApplication>(
        TYPE,
        CompanyApplication,
      );
    } catch (err) {
      logger.error("Error while initializing applications service", err);
    }
    return this;
  }

  create?(
    item: CompanyApplicationPrimaryKey,
    context?: CompanyExecutionContext,
  ): Promise<CreateResult<CompanyApplication>> {
    throw new Error("Method not implemented.");
  }
  get(
    pk: CompanyApplicationPrimaryKey,
    context?: CompanyExecutionContext,
  ): Promise<CompanyApplicationWithApplication> {
    throw new Error("Method not implemented.");
  }
  update?(
    pk: CompanyApplicationPrimaryKey,
    item: CompanyApplication,
    context?: CompanyExecutionContext,
  ): Promise<UpdateResult<CompanyApplication>> {
    throw new Error("Method not implemented.");
  }

  async save<SaveOptions>(
    item: Pick<CompanyApplicationPrimaryKey, "company_id" | "application_id">,
    _?: SaveOptions,
    context?: CompanyExecutionContext,
  ): Promise<SaveResult<CompanyApplication>> {
    if (!context.user.id) {
      throw new Error("Only an user of a company can add an application to a company.");
    }

    let operation = OperationType.UPDATE;
    let companyApplication = await this.repository.findOne({
      company_id: context.company.id,
      application_id: item.application_id,
    });
    if (!companyApplication) {
      operation = OperationType.CREATE;

      companyApplication = new CompanyApplication();
      companyApplication.company_id = context.company.id;
      companyApplication.application_id = item.application_id;
      companyApplication.created_at = new Date().getTime();
      companyApplication.created_by = context.user.id;

      await this.repository.save(companyApplication);
    }

    return new SaveResult(TYPE, companyApplication, operation);
  }

  async initWithDefaultApplications(companyId: string): Promise<void> {
    const defaultApps = await this.applicationService.listDefaults();
    for (let defaultApp of defaultApps.getEntities()) {
      await this.save({ company_id: companyId, application_id: defaultApp.id });
    }
  }

  delete(
    pk: ApplicationPrimaryKey,
    context?: CompanyExecutionContext,
  ): Promise<DeleteResult<CompanyApplication>> {
    throw new Error("Method not implemented.");
  }

  list<ListOptions>(
    pagination: Paginable,
    options?: ListOptions,
    context?: CompanyExecutionContext,
  ): Promise<ListResult<CompanyApplicationWithApplication>> {
    throw new Error("Method not implemented.");
  }
}
