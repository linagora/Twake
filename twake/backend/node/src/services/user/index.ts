import { Prefix, TwakeService } from "../../core/platform/framework";
import WebServerAPI from "../../core/platform/services/webserver/provider";
import web from "./web";

@Prefix("/internal/services/users/v1")
export default class UserService extends TwakeService<undefined> {
  version = "1";
  name = "user";

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
