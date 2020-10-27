import { TwakeService, Consumes, Prefix, ServiceName } from "../../framework";
import web from "./web/index";
import AuthServiceAPI from "./provider";
import WebServerAPI from "../webserver/provider";

@Prefix("/api/auth")
@Consumes(["webserver"])
@ServiceName("auth")
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
      web(instance, { prefix: this.prefix });
      next();
    });

    return this;
  }
}
