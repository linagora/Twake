import { IOptions as SocketIOJWTOptions } from "socketio-jwt";
import { Configuration, Consumes, ServiceName, TwakeService } from "../../framework";
import WebServerAPI from "../webserver/provider";
import WebSocketAPI from "./provider";
import websocketPlugin from "./plugin";
import { WebSocketService } from "./services";
import { AdaptersConfiguration } from "./types";
import PhpNodeAPI from "../phpnode/provider";

@Consumes(["webserver", "phpnode"])
@ServiceName("websocket")
export default class WebSocket extends TwakeService<WebSocketAPI> {
  private service: WebSocketService;
  name = "websocket";
  version = "1";

  api(): WebSocketAPI {
    return this.service;
  }

  async doInit(): Promise<this> {
    const phpnode = this.context.getProvider<PhpNodeAPI>("phpnode");
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

    phpnode.register((internalServer, _, next) => {
      internalServer.route({
        method: "POST",
        url: "/pusher",
        preValidation: [request => phpnode.accessControl(request, internalServer)],
        handler: (request, reply) => {
          const body = request.body as { room: string; data: any };
          const room = body.room;
          const data = body.data;
          this.service.getIo().to(room).emit("realtime:event", { name: room, data: data });
          reply.send({});
        },
      });
      next();
    });

    return this;
  }
}
