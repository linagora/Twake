import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import { Consumes, TwakeService } from "../../core/platform/framework";
import UserServiceAPI from "../user/api";
import { ConsoleServiceAPI } from "./api";
import { getService } from "./service";
import { ConsoleOptions, ConsoleType } from "./types";

@Consumes(["user", "database"])
export default class ConsoleService extends TwakeService<ConsoleServiceAPI> {
  version = "1";
  name = "console";
  private service: ConsoleServiceAPI;

  async doInit(): Promise<this> {
    const type = this.configuration.get<ConsoleType>("type");
    const options: ConsoleOptions = this.configuration.get<ConsoleOptions>(type);

    const x = this.context.getProvider<UserServiceAPI>("user");

    this.service = getService(
      this.context.getProvider<DatabaseServiceAPI>("database"),
      this.context.getProvider<UserServiceAPI>("user"),
      type,
      options,
    );

    return this;
  }

  api(): ConsoleServiceAPI {
    return this.service;
  }
}
