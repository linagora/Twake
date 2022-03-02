import socketIO, { Server } from "socket.io";
const { createClient } = require("redis");
import SocketIORedis from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import WebSocketAPI from "../provider";
import {
  WebSocket,
  WebSocketServiceConfiguration,
  WebSocketUser,
  WebsocketUserEvent,
} from "../types";
import { EventEmitter } from "events";
import { User } from "../../../../../utils/types";
import { JwtType } from "../../types";

export class WebSocketService extends EventEmitter implements WebSocketAPI {
  version: "1";
  private io: socketIO.Server;

  constructor(serviceConfiguration: WebSocketServiceConfiguration) {
    super();

    serviceConfiguration.ready(() => {
      console.log("Server was READY !");

      this.io = serviceConfiguration.server.io;

      if (serviceConfiguration.adapters?.types?.includes("redis")) {
        const pubClient = createClient(serviceConfiguration.adapters.redis);
        const subClient = pubClient.duplicate();
        this.io.adapter(SocketIORedis.createAdapter(pubClient, subClient));
      }

      this.io
        .use((socket, next) => {
          if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(
              socket.handshake.query.token as string,
              serviceConfiguration.auth.secret as string,
              (err, decoded) => {
                if (err) return next(new Error("Authentication error"));
                (socket as unknown as WebSocket).decoded_token = decoded as JwtType;
                next();
              },
            );
          } else {
            next(new Error("Authentication error"));
          }
        })
        .on("connection", socket => {
          console.log("New connection on websocket");
          console.log(socket);
          socket.on("message", message => {
            console.log("New message on websocket");
            console.log(message);
            this.io.emit("message", message);
          });
        })
        .on("authenticated", (socket: WebSocket) => {
          const user = this.getUser(socket);
          console.log("User is authenticated on websocket");
          console.log(user);

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
