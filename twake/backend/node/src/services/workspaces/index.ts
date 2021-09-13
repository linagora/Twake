import { Consumes, Prefix, TwakeService } from "../../core/platform/framework";
import WorkspaceServiceAPI from "./api";
import web from "./web/index";
import { getService } from "./services";
import { ConsoleServiceAPI } from "../console/api";
import { PlatformServicesAPI } from "../../core/platform/services/platform-services";
import { ApplicationServiceAPI } from "../applications/api";

@Prefix("/internal/services/workspaces/v1")
@Consumes(["platform-services", "console", "applications"])
export default class WorkspaceService extends TwakeService<WorkspaceServiceAPI> {
  version = "1";
  name = "workspaces";
  private service: WorkspaceServiceAPI;

  public async doInit(): Promise<this> {
    const platformServices = this.context.getProvider<PlatformServicesAPI>("platform-services");

    const fastify = platformServices.fastify.getServer();
    const console = this.context.getProvider<ConsoleServiceAPI>("console");
    const applications = this.context.getProvider<ApplicationServiceAPI>("applications");

    this.service = getService(platformServices, console, applications);
    await this.service?.init(this.context);

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service });
      next();
    });

    return this;
  }

  api(): WorkspaceServiceAPI {
    return this.service;
  }
}
