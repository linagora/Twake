import { Consumes, Prefix, TwakeService } from "../../core/platform/framework";
import WorkspaceServiceAPI from "./api";
import web from "./web/index";
import { getService } from "./services";
import { ConsoleServiceAPI } from "../console/api";
import { PlatformServicesAPI } from "../../core/platform/services/platform-services";
import { ApplicationServiceAPI } from "../applications/api";
import AuthServiceAPI from "../../core/platform/services/auth/provider";
import { RealtimeServiceAPI } from "../../core/platform/services/realtime/api";
import UserServiceAPI from "../user/api";

@Prefix("/internal/services/workspaces/v1")
@Consumes(["platform-services", "console", "applications", "auth", "realtime"])
export default class WorkspaceService extends TwakeService<WorkspaceServiceAPI> {
  version = "1";
  name = "workspaces";
  private service: WorkspaceServiceAPI;

  public async doInit(): Promise<this> {
    const platformServices = this.context.getProvider<PlatformServicesAPI>("platform-services");

    const fastify = platformServices.fastify.getServer();
    const console = this.context.getProvider<ConsoleServiceAPI>("console");
    const applications = this.context.getProvider<ApplicationServiceAPI>("applications");
    const auth = this.context.getProvider<AuthServiceAPI>("auth");
    const realtime = this.context.getProvider<RealtimeServiceAPI>("realtime");
    const users = this.context.getProvider<UserServiceAPI>("user");

    this.service = getService(platformServices, console, applications, auth, users);
    await this.service?.init(this.context);

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service, realtime });
      next();
    });

    return this;
  }

  api(): WorkspaceServiceAPI {
    return this.service;
  }
}
