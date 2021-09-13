import {
  ApplicationServiceAPI,
  CompanyApplicationServiceAPI,
  MarketplaceApplicationServiceAPI,
} from "../api";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";
import { getService as getApplicationService } from "./applications";
import { getService as getCompanyApplicationService } from "./company-applications";

export function getService(platformService: PlatformServicesAPI): ApplicationServiceAPI {
  return new Service(platformService);
}

class Service {
  version: "1";
  applications: MarketplaceApplicationServiceAPI;
  companyApplications: CompanyApplicationServiceAPI;

  constructor(readonly platformService: PlatformServicesAPI) {
    this.applications = getApplicationService(platformService);
    this.companyApplications = getCompanyApplicationService(platformService, this.applications);
  }

  async init(): Promise<this> {
    await this.applications.init();
    await this.companyApplications.init();
    return this;
  }
}
