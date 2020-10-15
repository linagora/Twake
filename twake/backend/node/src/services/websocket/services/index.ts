import socketIO from "socket.io";
import SocketIORedis from "socket.io-redis";
import socketIOJWT from "socketio-jwt";
import WebSocketAPI from "../provider";
import { WebSocketServiceConfiguration } from "../types";

export class WebSocketService implements WebSocketAPI {
  version: "1";
  private io: socketIO.Server;

  constructor(serviceConfiguration: WebSocketServiceConfiguration) {
    this.io = socketIO(serviceConfiguration.server, serviceConfiguration.options);

    if (serviceConfiguration.adapters?.types?.includes("redis")) {
      this.io.adapter(SocketIORedis(serviceConfiguration.adapters.redis));
    }

    this.io.sockets
      .on("connection", socketIOJWT.authorize({
        secret: serviceConfiguration.auth.secret,
        timeout: 15000
      }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("authenticated", (socket: any) => {
        console.log(`User is authenticated! ${socket.decoded_token}`);
      });
  }

  getIo(): socketIO.Server {
    return this.io;
  }
}