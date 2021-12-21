import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import web from "./web/index";
import { PlatformServicesAPI } from "../../core/platform/services/platform-services";
import { ApplicationsApiServiceAPI } from "./api";
import { ApplicationServiceAPI } from "../applications/api";
import { getService } from "./services";
import AuthServiceAPI from "../../core/platform/services/auth/provider";

@Prefix("/api")
@Consumes(["platform-services", "applications"])
export default class ApplicationsApiService extends TwakeService<ApplicationsApiServiceAPI> {
  version = "1";
  name = "applicationsapi";
  service: ApplicationsApiServiceAPI;

  api(): ApplicationsApiServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const platformServices = this.context.getProvider<PlatformServicesAPI>("platform-services");
    const applicationService = this.context.getProvider<ApplicationServiceAPI>("applications");
    const authService = this.context.getProvider<AuthServiceAPI>("auth");
    const fastify = platformServices.fastify.getServer();

    this.service = getService(platformServices, applicationService, authService);
    await this.service.init();

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service });
      next();
    });

    return this;
  }
}
