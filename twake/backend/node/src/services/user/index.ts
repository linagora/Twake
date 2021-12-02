import { Consumes, Prefix, TwakeService } from "../../core/platform/framework";
import UserServiceAPI from "./api";
import web from "./web/index";
import { getService } from "./services";
import { PlatformServicesAPI } from "../../core/platform/services/platform-services";
import { ApplicationServiceAPI } from "../applications/api";
import { StatisticsAPI } from "../statistics/types";
import AuthServiceAPI from "../../core/platform/services/auth/provider";
import { RealtimeServiceAPI } from "../../core/platform/services/realtime/api";

@Prefix("/internal/services/users/v1")
@Consumes(["platform-services", "applications", "statistics", "auth", "realtime"])
export default class UserService extends TwakeService<UserServiceAPI> {
  version = "1";
  name = "user";
  private service: UserServiceAPI;

  public async doInit(): Promise<this> {
    const platformServices = this.context.getProvider<PlatformServicesAPI>("platform-services");
    const applications = this.context.getProvider<ApplicationServiceAPI>("applications");
    const statistics = this.context.getProvider<StatisticsAPI>("statistics");
    const auth = this.context.getProvider<AuthServiceAPI>("auth");
    const realtime = this.context.getProvider<RealtimeServiceAPI>("realtime");

    this.service = getService(platformServices, applications, statistics, auth);

    await this.service?.init(this.context);
    platformServices.fastify.getServer().register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service, realtime });
      next();
    });
    return this;
  }

  api(): UserServiceAPI {
    return this.service;
  }
}
