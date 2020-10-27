import WebServerAPI from "../../core/platform/services/webserver/provider";
import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import ChannelServiceAPI from "./provider";
import { getService } from "./services";
import web from "./web/index";
import { Channel } from "./entities";
import { DatabaseServiceAPI } from "../../core/platform/services/database/api";

@Prefix("/api/channels")
@Consumes(["webserver", "database"])
export default class ChannelService extends TwakeService<ChannelServiceAPI<Channel>> {
  version = "1";
  name = "channels";
  service: ChannelServiceAPI<Channel>;

  api(): ChannelServiceAPI<Channel> {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();
    const database = this.context.getProvider<DatabaseServiceAPI>("database");

    this.service = getService(database);

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service });
      next();
    });

    return this;
  }
}


