import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import { Consumes, Prefix, TwakeService } from "../../core/platform/framework";
import UserServiceAPI from "../user/api";
import { ConsoleServiceAPI } from "./api";
import { getService } from "./service";
import { ConsoleOptions, ConsoleType } from "./types";
import web from "./web/index";
import WebServerAPI from "../../core/platform/services/webserver/provider";
import AuthServiceAPI from "../../core/platform/services/auth/provider";

@Prefix("/internal/services/console/v1")
@Consumes(["user", "database"])
export default class ConsoleService extends TwakeService<ConsoleServiceAPI> {
  version = "1";
  name = "console";
  private service: ConsoleServiceAPI;

  async doInit(): Promise<this> {
    const type = this.configuration.get<ConsoleType>("type");
    const options: ConsoleOptions = this.configuration.get<ConsoleOptions>(type);

    this.service = getService(
      this.context.getProvider<DatabaseServiceAPI>("database"),
      this.context.getProvider<UserServiceAPI>("user"),
      type,
      options,
    );

    return this;
  }

  async doStart(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();

    const authService = this.context.getProvider<AuthServiceAPI>("auth");
    const userService = this.context.getProvider<UserServiceAPI>("user");
    // FixMe: reimplement (temp cause of circular dependency user -> console -> user)
    this.service.services.userService = userService;

    fastify.register((instance, _opts, next) => {
      web(instance, {
        prefix: this.prefix,
        service: this.service,
        authService: authService,
        userService: userService,
      });
      next();
    });
    return this;
  }

  api(): ConsoleServiceAPI {
    return this.service;
  }
}
