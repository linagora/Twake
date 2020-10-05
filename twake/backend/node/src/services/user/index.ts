import WebServerAPI from "../webserver/provider";
import { TwakeService } from "../../core/platform/service";
import User from "./entity/user";
import UserServiceAPI from "./provider";
import web from "./web/index";

export default class UserService extends TwakeService<UserServiceAPI> implements UserServiceAPI {
  version = "1";
  name = "user";

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.options.prefix });
      next();
    });

    return this;
  }

  async get(id: string): Promise<User> {
    return new User(id);
  }

  api(): UserServiceAPI {
    return this;
  }
}
