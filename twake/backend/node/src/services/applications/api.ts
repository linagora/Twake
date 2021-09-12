import { ExecutionContext } from "../../core/platform/framework/api/crud-service";
import { CRUDService } from "../../core/platform/framework/api/crud-service";
import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";
import Application, { ApplicationPrimaryKey } from "./entities/application";
import { CompanyExecutionContext } from "./web/types";

export interface ApplicationServiceAPI extends TwakeServiceProvider, Initializable {
  applications: MarketplaceApplicationServiceAPI;
  companyApplications: CompanyApplicationServiceAPI;
}

export interface MarketplaceApplicationServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<Application, ApplicationPrimaryKey, ExecutionContext> {}

export interface CompanyApplicationServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<Application, ApplicationPrimaryKey, CompanyExecutionContext> {}
