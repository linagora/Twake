import { Prefix, TwakeService } from "src/core/platform/framework";
import WebServerAPI from "src/core/platform/services/webserver/provider";
import web from "./web";

@Prefix("/internal/services/documents/v1")
export default class DocumentsService extends TwakeService<undefined> {
  version = "1";
  name = "drive";

  public doInit: () => Promise<this> = async () => {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();
    fastify.register((instance, _options, next) => {
      web(instance, { prefix: this.prefix });
      next();
    });
    return this;
  };

  api = (): undefined => {
    return undefined;
  };
}
