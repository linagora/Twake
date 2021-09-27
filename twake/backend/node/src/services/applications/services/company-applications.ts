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
  Pagination,
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
      console.log(err);
      logger.error("Error while initializing applications service");
    }
    return this;
  }

  async get(
    pk: CompanyApplicationPrimaryKey,
    context?: CompanyExecutionContext,
  ): Promise<CompanyApplicationWithApplication> {
    let companyApplication = await this.repository.findOne({
      group_id: context.company.id,
      app_id: pk.application_id,
    });

    const application = await this.applicationService.get({ id: pk.application_id });

    return {
      ...companyApplication,
      application: application,
    };
  }

  async save<SaveOptions>(
    item: Pick<CompanyApplicationPrimaryKey, "company_id" | "application_id">,
    _?: SaveOptions,
    context?: CompanyExecutionContext,
  ): Promise<SaveResult<CompanyApplication>> {
    if (!context?.user?.id && !context?.user?.server_request) {
      throw new Error("Only an user of a company can add an application to a company.");
    }

    let operation = OperationType.UPDATE;
    let companyApplication = await this.repository.findOne({
      group_id: context.company.id,
      app_id: item.application_id,
    });
    if (!companyApplication) {
      operation = OperationType.CREATE;

      companyApplication = new CompanyApplication();
      companyApplication.company_id = context.company.id;
      companyApplication.application_id = item.application_id;
      companyApplication.created_at = new Date().getTime();
      companyApplication.created_by = context?.user?.id || "";

      await this.repository.save(companyApplication);
    }

    return new SaveResult(TYPE, companyApplication, operation);
  }

  async initWithDefaultApplications(
    companyId: string,
    context: CompanyExecutionContext,
  ): Promise<void> {
    const defaultApps = await this.applicationService.listDefaults();
    for (let defaultApp of defaultApps.getEntities()) {
      await this.save({ company_id: companyId, application_id: defaultApp.id }, {}, context);
    }
  }

  async delete(
    pk: CompanyApplicationPrimaryKey,
    context?: CompanyExecutionContext,
  ): Promise<DeleteResult<CompanyApplication>> {
    let companyApplication = await this.repository.findOne({
      group_id: context.company.id,
      app_id: pk.application_id,
    });

    let deleted = false;
    if (companyApplication) {
      this.repository.remove(companyApplication);
      deleted = true;
    }

    return new DeleteResult(TYPE, companyApplication, deleted);
  }

  async list<ListOptions>(
    pagination: Pagination,
    options?: ListOptions,
    context?: CompanyExecutionContext,
  ): Promise<ListResult<CompanyApplicationWithApplication>> {
    let companyApplications = await this.repository.find(
      {
        group_id: context.company.id,
      },
      { pagination },
    );

    let applications = [];

    for (const companyApplication of companyApplications.getEntities()) {
      const application = await this.applicationService.get({
        id: companyApplication.application_id,
      });
      if (application)
        applications.push({
          ...companyApplication,
          application: application,
        });
    }

    return new ListResult<CompanyApplicationWithApplication>(
      TYPE,
      applications,
      companyApplications.nextPage,
    );
  }
}
