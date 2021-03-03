import { TwakeService, Consumes } from "../../core/platform/framework";
import UserServiceAPI from "../user/api";
import { ConsoleServiceAPI } from "./api";
import { getService } from "./service";

@Consumes(["user"])
export default class ConsoleService extends TwakeService<ConsoleServiceAPI> {
  version = "1";
  name = "console";
  private service: ConsoleServiceAPI;

  async doInit(): Promise<this> {
    this.service = getService(this.context.getProvider<UserServiceAPI>("user"));

    return this;
  }

  api(): ConsoleServiceAPI {
    return this.service;
  }
}
