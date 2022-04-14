import { Prefix, TwakeService } from "../../core/platform/framework";
import { WorkspaceService } from "./api";
import WebServerAPI from "../../core/platform/services/webserver/provider";
import web from "./web";

@Prefix("/internal/services/workspaces/v1")
export default class Service extends TwakeService<WorkspaceService> {
  version = "1";
  name = "workspaces";

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();
    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix });
      next();
    });
    return this;
  }

  api(): WorkspaceService {
    return null;
  }
}
