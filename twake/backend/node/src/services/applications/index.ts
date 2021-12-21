import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import { ApplicationServiceAPI } from "./api";
import { getService } from "./services/index";
import web from "./web/index";
import { PlatformServicesAPI } from "../../core/platform/services/platform-services";
import UserServiceAPI from "../user/api";
import { RealtimeServiceAPI } from "../../core/platform/services/realtime/api";

@Prefix("/internal/services/applications/v1")
@Consumes(["platform-services", "realtime"])
export default class ApplicationsService extends TwakeService<ApplicationServiceAPI> {
  version = "1";
  name = "applications";
  service: ApplicationServiceAPI;

  api(): ApplicationServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const platformServices = this.context.getProvider<PlatformServicesAPI>("platform-services");
    const fastify = platformServices.fastify.getServer();
    this.service = getService(platformServices, null);
    const realtime = this.context.getProvider<RealtimeServiceAPI>("realtime");
    await this.service.init(this.context);

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service, realtime });
      next();
    });

    return this;
  }
}
