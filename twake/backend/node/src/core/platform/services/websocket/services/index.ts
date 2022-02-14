import socketIO from "socket.io";
import SocketIORedis from "socket.io-redis";
import socketIOJWT from "socketio-jwt";
import WebSocketAPI from "../provider";
import {
  WebSocket,
  WebSocketServiceConfiguration,
  WebSocketUser,
  WebsocketUserEvent,
} from "../types";
import { EventEmitter } from "events";
import { User } from "../../../../../utils/types";

export class WebSocketService extends EventEmitter implements WebSocketAPI {
  version: "1";
  private io: socketIO.Server;

  constructor(serviceConfiguration: WebSocketServiceConfiguration) {
    super();
    this.io = socketIO(serviceConfiguration.server, serviceConfiguration.options);

    if (serviceConfiguration.adapters?.types?.includes("redis")) {
      this.io.adapter(SocketIORedis.createAdapter(serviceConfiguration.adapters.redis));
    }

    this.io.sockets
      .on(
        "connection",
        socketIOJWT.authorize({
          secret: serviceConfiguration.auth.secret,
          timeout: 15000,
        }),
      )
      .on("authenticated", (socket: WebSocket) => {
        const user = this.getUser(socket);

        this.emit("user:connected", {
          user,
          socket,
          event: "user:connected",
        } as WebsocketUserEvent);

        socket.on("disconnect", () =>
          this.emit("user:disconnected", {
            user,
            socket,
            event: "user:disconnected",
          } as WebsocketUserEvent),
        );
      });
  }

  onUserConnected(listener: (event: WebsocketUserEvent) => void): this {
    return this.on("user:connected", listener);
  }

  onUserDisconnected(listener: (event: WebsocketUserEvent) => void): this {
    return this.on("user:disconnected", listener);
  }

  getUser(socket: WebSocket): WebSocketUser {
    return {
      id: socket.decoded_token.sub,
      identity_provider_id: socket.decoded_token.provider_id,
      email: socket.decoded_token.email,
      token: socket.decoded_token,
      allow_tracking: socket.decoded_token.track,
    };
  }

  getIo(): socketIO.Server {
    return this.io;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isConnected(user: User): boolean {
    return false;
  }
}
