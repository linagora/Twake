import WebServerAPI from "../webserver/provider";
import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import ChannelServiceAPI from "./provider";
import web from "./web/index";

@Prefix("/api/channels")
@Consumes(["webserver"])
export default class ChannelsService extends TwakeService<ChannelServiceAPI> implements ChannelServiceAPI {
  version = "1";
  name = "channels";

  api(): ChannelServiceAPI {
    return this;
  }

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix });
      next();
    });

    return this;
  }

  async send(): Promise<void> {
    console.log("TODO");
  }

  async receive(): Promise<void> {
    console.log("TODO");
  }
}


