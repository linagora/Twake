import { Multipart } from "fastify-multipart";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { MarketplaceApplicationServiceAPI } from "../api";
import StorageAPI from "../../../core/platform/services/storage/provider";
import Application from "../entities/application";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { CompanyExecutionContext } from "../web/types";
import { logger } from "../../../core/platform/framework";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";

export function getService(platformService: PlatformServicesAPI): MarketplaceApplicationServiceAPI {
  return new ApplicationService(platformService);
}

class ApplicationService implements MarketplaceApplicationServiceAPI {
  version: "1";
  repository: Repository<Application>;

  constructor(readonly platformService: PlatformServicesAPI) {}

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
