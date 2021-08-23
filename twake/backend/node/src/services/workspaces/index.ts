import WebServerAPI from "../../core/platform/services/webserver/provider";
import { Consumes, Prefix, TwakeService } from "../../core/platform/framework";
import WorkspaceServiceAPI from "./api";
import web from "./web/index";
import { getService } from "./services";
import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import { ConsoleServiceAPI } from "../console/api";
import { SearchServiceAPI } from "../../core/platform/services/search/api";
import CounterAPI, { CounterProvider } from "../../core/platform/services/counter/provider";
import { CounterType } from "../../core/platform/services/counter/types";

@Prefix("/internal/services/workspaces/v1")
@Consumes(["webserver", "database", "console", "search", "counter"])
export default class WorkspaceService extends TwakeService<WorkspaceServiceAPI> {
  version = "1";
  name = "workspaces";
  private service: WorkspaceServiceAPI;

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();
    const database = this.context.getProvider<DatabaseServiceAPI>("database");
    const console = this.context.getProvider<ConsoleServiceAPI>("console");
    const search = this.context.getProvider<SearchServiceAPI>("search");
    const counter = this.context.getProvider<CounterAPI>("counter");

    this.service = getService(database, console, search, counter);
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
