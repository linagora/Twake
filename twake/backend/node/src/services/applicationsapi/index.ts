import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import web from "./web/index";
import { PlatformServicesAPI } from "../../core/platform/services/platform-services";
import { ApplicationsApiServiceAPI } from "./api";
import { ApplicationServiceAPI } from "../applications/api";
import { getService } from "./services";

@Prefix("/api/v1")
@Consumes(["platform-services", "applications"])
export default class ApplicationsApiService extends TwakeService<ApplicationsApiServiceAPI> {
  version = "1";
  name = "applicationsapi";
  service: ApplicationsApiServiceAPI

  api(): ApplicationsApiServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const platformServices = this.context.getProvider<PlatformServicesAPI>("platform-services");
    const applicationService = this.context.getProvider<ApplicationServiceAPI>("applications");
    const fastify = platformServices.fastify.getServer();

    this.service = getService(platformServices, applicationService);
    await this.service.init();

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service });
      next();
    });

    return this;
  }
}
