import socketIO from "socket.io";
import SocketIORedis from "socket.io-redis";
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
  }

  getIo(): socketIO.Server {
    return this.io;
  }
}