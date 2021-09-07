import { CompanyApplicationServiceAPI, MarketplaceApplicationServiceAPI } from "../api";
import Application from "../entities/application";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { logger } from "../../../core/platform/framework";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";

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
}
