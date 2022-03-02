import { Consumes, ServiceName, TwakeService } from "../../framework";
import WebServerAPI from "../webserver/provider";
import WebSocketAPI from "./provider";
import { WebSocketService } from "./services";
import { AdaptersConfiguration } from "./types";

@Consumes(["webserver"])
@ServiceName("websocket")
export default class WebSocket extends TwakeService<WebSocketAPI> {
  private service: WebSocketService;
  name = "websocket";
  version = "1";

  api(): WebSocketAPI {
    return this.service;
  }

  async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();

    this.service = new WebSocketService({
      server: fastify,
      options: {
        path: this.configuration.get<string>("path", "/socket"),
      },
      adapters: this.configuration.get<AdaptersConfiguration>("adapters"),
      auth: this.configuration.get<{ secret: string }>("auth.jwt"),
    });

    return this;
  }
}
