import { Consumes, Prefix, TwakeService } from "../../core/platform/framework";
import WorkspaceService from "./api";
import web from "./web/index";
import { getService } from "./services";
import { ConsoleServiceAPI } from "../console/api";
import { PlatformServicesAPI } from "../../core/platform/services/platform-services";
import { ApplicationServiceAPI } from "../applications/api";
import AuthServiceAPI from "../../core/platform/services/auth/provider";
import { RealtimeServiceAPI } from "../../core/platform/services/realtime/api";
import UserServiceAPI from "../user/api";
import { StatisticsAPI } from "../statistics/types";

@Prefix("/internal/services/workspaces/v1")
@Consumes(["platform-services", "console", "applications", "auth", "realtime"])
export default class Service extends TwakeService<WorkspaceService> {
  version = "1";
  name = "workspaces";
  private service: WorkspaceService;

  public async doInit(): Promise<this> {
    const platformServices = this.context.getProvider<PlatformServicesAPI>("platform-services");

    const fastify = platformServices.fastify.getServer();
    const console = this.context.getProvider<ConsoleServiceAPI>("console");
    const applications = this.context.getProvider<ApplicationServiceAPI>("applications");
    const statistics = this.context.getProvider<StatisticsAPI>("statistics");
    const auth = this.context.getProvider<AuthServiceAPI>("auth");
    const realtime = this.context.getProvider<RealtimeServiceAPI>("realtime");
    const users = this.context.getProvider<UserServiceAPI>("user");

    this.service = getService(platformServices, console, applications, auth, users, statistics);
    await this.service?.init(this.context);

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, realtime });
      next();
    });

    return this;
  }

  api(): WorkspaceService {
    return this.service;
  }
}
