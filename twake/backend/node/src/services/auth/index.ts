import { TwakeService } from "../../core/platform/service";
import web from "./web/index";
import AuthServiceAPI from "./provider";
import WebServerAPI from "../webserver/provider";

export default class AuthService extends TwakeService<AuthServiceAPI> implements AuthServiceAPI {
  name = "auth";
  version = "1";

  api(): AuthServiceAPI {
    return this;
  }

  getTypes(): Array<string> {
    return [];
  }

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.options.prefix });
      next();
    });

    return this;
  }
}
