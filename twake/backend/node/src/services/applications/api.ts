import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";

export interface ApplicationServiceAPI extends TwakeServiceProvider, Initializable {
  applications: MarketplaceApplicationServiceAPI;
  companyApplications: CompanyApplicationServiceAPI;
}

export interface MarketplaceApplicationServiceAPI extends TwakeServiceProvider, Initializable {}

export interface CompanyApplicationServiceAPI extends TwakeServiceProvider, Initializable {}
