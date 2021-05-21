import WebServerAPI from "../../core/platform/services/webserver/provider";
import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import { GeneralServiceAPI } from "./api";

@Prefix("/internal/services/general/v1")
@Consumes(["webserver"])
export default class MessageService extends TwakeService<GeneralServiceAPI> {
  version = "1";
  name = "general";
  service: GeneralServiceAPI;

  api(): GeneralServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();

    return this;
  }
}
