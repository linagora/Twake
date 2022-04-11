import {
  ApplicationHooksServiceAPI,
  ApplicationServiceAPI,
  CompanyApplicationServiceAPI,
  MarketplaceApplicationServiceAPI,
} from "../api";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";
import { getService as getApplicationService } from "./applications";
import { getService as getCompanyApplicationService } from "./company-applications";
import { getService as getCompaniesService } from "../../user/services/companies";
import UserServiceAPI, { CompaniesServiceAPI } from "../../user/api";
import { ApplicationHooksService } from "./hooks";
import { InternalToHooksProcessor } from "./internal-event-to-hooks";

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
  hooks: ApplicationHooksServiceAPI;
  internalToHooksProcessor: InternalToHooksProcessor;

  constructor(readonly platformService: PlatformServicesAPI, userServiceAPI: UserServiceAPI) {
    this.applications = getApplicationService(platformService);
    this.companyApplications = getCompanyApplicationService(platformService, this.applications);
    this.companies = getCompaniesService(platformService, userServiceAPI);
    this.hooks = new ApplicationHooksService(platformService, this.applications);
  }

  async init(): Promise<this> {
    await this.applications.init();
    await this.companyApplications.init();
    await this.companies.init();

    this.platformService.pubsub.processor.addHandler(
      new InternalToHooksProcessor(this.platformService, this),
    );

    return this;
  }
}
