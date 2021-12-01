import WebServerAPI from "../../core/platform/services/webserver/provider";
import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import ChannelServiceAPI from "./provider";
import { getService } from "./services";
import web from "./web/index";
import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../core/platform/services/pubsub/api";
import UserServiceAPI from "../user/api";
import { RealtimeServiceAPI } from "../../core/platform/services/realtime/api";

@Prefix("/internal/services/channels/v1")
@Consumes(["webserver", "database", "pubsub", "user", "websockets"])
export default class ChannelService extends TwakeService<ChannelServiceAPI> {
  version = "1";
  name = "channels";
  service: ChannelServiceAPI;

  api(): ChannelServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();
    const database = this.context.getProvider<DatabaseServiceAPI>("database");
    const pubsub = this.context.getProvider<PubsubServiceAPI>("pubsub");
    const user = this.context.getProvider<UserServiceAPI>("user");
    const realtime = this.context.getProvider<RealtimeServiceAPI>("realtime");

    this.service = getService(database, pubsub, user);
    this.service.init && (await this.service.init());

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service, realtime });
      next();
    });

    return this;
  }
}
