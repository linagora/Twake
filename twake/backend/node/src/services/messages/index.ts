import WebServerAPI from "../webserver/provider";
import { TwakeService, Prefix, Consumes } from "../../core/platform";
import MessageServiceAPI from "./provider";
import web from "./web/index";

@Prefix("/api/messages")
@Consumes(["webserver"])
export default class MessageService extends TwakeService<MessageServiceAPI> implements MessageServiceAPI {
  version = "1";
  name = "messages";

  api(): MessageServiceAPI {
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


