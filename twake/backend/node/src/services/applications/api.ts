import {
  ExecutionContext,
  ListResult,
  Pagination,
  SaveResult,
} from "../../core/platform/framework/api/crud-service";
import { CRUDService } from "../../core/platform/framework/api/crud-service";
import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";
import Application, { ApplicationPrimaryKey } from "./entities/application";
import { CompanyExecutionContext } from "./web/types";
import CompanyApplication, { CompanyApplicationPrimaryKey } from "./entities/company-application";

export interface ApplicationServiceAPI extends TwakeServiceProvider, Initializable {
  applications: MarketplaceApplicationServiceAPI;
  companyApplications: CompanyApplicationServiceAPI;
}

export interface MarketplaceApplicationServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<Application, ApplicationPrimaryKey, ExecutionContext> {
  listDefaults<ListOptions>(
    pagination?: Pagination,
    options?: ListOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<Application>>;
}

export interface CompanyApplicationServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<CompanyApplication, CompanyApplicationPrimaryKey, CompanyExecutionContext> {
  initWithDefaultApplications(companyId: string, context: CompanyExecutionContext): Promise<void>;

  save<SaveOptions>(
    item: Pick<CompanyApplicationPrimaryKey, "company_id" | "application_id">,
    _?: SaveOptions,
    context?: CompanyExecutionContext,
  ): Promise<SaveResult<CompanyApplication>>;
}
