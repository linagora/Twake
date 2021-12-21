import {
  ApplicationServiceAPI,
  CompanyApplicationServiceAPI,
  MarketplaceApplicationServiceAPI,
} from "../api";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";
import { getService as getApplicationService } from "./applications";
import { getService as getCompanyApplicationService } from "./company-applications";
import { getService as getCompaniesService } from "../../user/services/companies";
import UserServiceAPI, { CompaniesServiceAPI } from "../../user/api";

export function getService(
  platformService: PlatformServicesAPI,
  userServiceAPI: UserServiceAPI,
): ApplicationServiceAPI {
  return new Service(platformService, userServiceAPI);
}

class Service {
  version: "1";
  applications: MarketplaceApplicationServiceAPI;
  companyApplications: CompanyApplicationServiceAPI;
  companies: CompaniesServiceAPI;

  constructor(readonly platformService: PlatformServicesAPI, userServiceAPI: UserServiceAPI) {
    this.applications = getApplicationService(platformService);
    this.companyApplications = getCompanyApplicationService(platformService, this.applications);
    this.companies = getCompaniesService(platformService, userServiceAPI);
  }

  async init(): Promise<this> {
    await this.applications.init();
    await this.companyApplications.init();
    await this.companies.init();
    return this;
  }
}
