import WebServerAPI from "../webserver/provider";
import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import ChannelServiceAPI from "./provider";
import * as services from "./services";
import web from "./web/index";
import ORMServiceAPI from "../orm/provider";

@Prefix("/api/channels")
@Consumes(["webserver", "orm"])
export default class ChannelService extends TwakeService<ChannelServiceAPI> {
  version = "1";
  name = "channels";
  service: ChannelServiceAPI;

  api(): ChannelServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();
    const orm = this.context.getProvider<ORMServiceAPI>("orm");

    this.service = new services.ChannelService(orm);

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service });
      next();
    });

    return this;
  }
}


