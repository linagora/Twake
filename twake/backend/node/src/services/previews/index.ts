import WebServerAPI from "../../core/platform/services/webserver/provider";
import { Prefix, TwakeService } from "../../core/platform/framework";
import { PreviewServiceAPI } from "./api";
import web from "./web";

@Prefix("/internal/services/previews/v1")
export default class PreviewsService extends TwakeService<PreviewServiceAPI> {
  version = "1";
  name = "previews";
  service: PreviewServiceAPI;

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();
    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix });
      next();
    });
    return this;
  }

  // TODO: remove
  api(): undefined {
    return undefined;
  }
}
