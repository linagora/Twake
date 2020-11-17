import { IOptions as SocketIOJWTOptions } from "socketio-jwt";
import { Consumes, ServiceName, TwakeService } from "../../framework";
import WebServerAPI from "../webserver/provider";
import WebSocketAPI from "./provider";
import websocketPlugin from "./plugin";
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
      server: fastify.server,
      options: {
        path: this.configuration.get<string>("path", "/socket"),
      },
      adapters: this.configuration.get<AdaptersConfiguration>("adapters"),
      auth: this.configuration.get<SocketIOJWTOptions>("auth.jwt"),
    });

    fastify.register(websocketPlugin, {
      io: this.service.getIo(),
    });

    /**
     * This implementation is for php old code to push on new socket.io server
     */
    fastify.post("/private/pusher", {}, (request, reply) => {
      const token = (request.headers.authorization || "").trim().split("Token ").pop();
      const secret = this.configuration.get<string>("php_pusher_secret", "");
      if (secret && token === secret) {
        const body = request.body as { room: string; data: any };
        const room = body.room;
        const data = body.data;
        this.service.getIo().to(room).emit("realtime:event", { name: room, data: data });
        reply.send({});
      } else {
        reply.code(401).send({});
      }
    });

    return this;
  }
}
