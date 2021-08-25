import WebServerAPI from "../../core/platform/services/webserver/provider";
import { Consumes, Prefix, TwakeService } from "../../core/platform/framework";
import WorkspaceServiceAPI from "./api";
import web from "./web/index";
import { getService } from "./services";
import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import { ConsoleServiceAPI } from "../console/api";
import UserServiceAPI from "../user/api";
import { SearchServiceAPI } from "../../core/platform/services/search/api";
import { PlatformServicesAPI } from "../../core/platform/services/platform-services";

@Prefix("/internal/services/workspaces/v1")
@Consumes(["platform-services"])
export default class WorkspaceService extends TwakeService<WorkspaceServiceAPI> {
  version = "1";
  name = "workspaces";
  private service: WorkspaceServiceAPI;

  public async doInit(): Promise<this> {
    const platformServices = this.context.getProvider<PlatformServicesAPI>("platform-services");

    const fastify = platformServices.fastify.getServer();
    const database = platformServices.database;
    const console = platformServices.console;
    const search = platformServices.search;

    this.service = getService(database, console, search);
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
