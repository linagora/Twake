import {
  CRUDService,
  DeleteResult,
  ExecutionContext,
  ListResult,
  Paginable,
  Pagination,
  SaveResult,
} from "../../core/platform/framework/api/crud-service";
import { Initializable, TwakeServiceProvider } from "../../core/platform/framework/api";
import Application, {
  ApplicationPrimaryKey,
  PublicApplicationObject,
} from "./entities/application";
import { CompanyExecutionContext } from "./web/types";
import {
  CompanyApplicationPrimaryKey,
  CompanyApplicationWithApplication,
} from "./entities/company-application";

export interface MarketplaceApplicationServiceAPI extends TwakeServiceProvider, Initializable {
  get(pk: ApplicationPrimaryKey, context?: ExecutionContext): Promise<Application>;

  listUnpublished(): Promise<Application[]>;

  list<ListOptions>(
    pagination: Paginable,
    options?: ListOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<PublicApplicationObject>>;

  save<SaveOptions>(
    item: Application,
    options?: SaveOptions,
    context?: ExecutionContext,
  ): Promise<SaveResult<Application>>;

  listDefaults<ListOptions>(
    pagination?: Pagination,
    options?: ListOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<PublicApplicationObject>>;

  publish(pk: ApplicationPrimaryKey): Promise<void>;
  unpublish(pk: ApplicationPrimaryKey): Promise<void>;

  notifyApp(
    application_id: string,
    connection_id: string,
    user_id: string,
    type: string,
    name: string,
    content: any,
  ): Promise<void>;

  delete(pk: ApplicationPrimaryKey, context?: ExecutionContext): Promise<DeleteResult<Application>>;
}

export interface CompanyApplicationServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<
      CompanyApplicationWithApplication,
      CompanyApplicationPrimaryKey,
      CompanyExecutionContext
    > {
  initWithDefaultApplications(companyId: string, context: CompanyExecutionContext): Promise<void>;

  save<SaveOptions>(
    item: Pick<CompanyApplicationPrimaryKey, "company_id" | "application_id">,
    _?: SaveOptions,
    context?: CompanyExecutionContext,
  ): Promise<SaveResult<CompanyApplicationWithApplication>>;

  get(
    item: Pick<CompanyApplicationPrimaryKey, "company_id" | "application_id">,
    context?: CompanyExecutionContext,
  ): Promise<CompanyApplicationWithApplication>;

  delete(
    item: Pick<CompanyApplicationPrimaryKey, "company_id" | "application_id">,
    context?: CompanyExecutionContext,
  ): Promise<DeleteResult<CompanyApplicationWithApplication>>;
}
