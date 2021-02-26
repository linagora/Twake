import { Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import { IOptions as SocketIOJWTOptions } from "socketio-jwt";
import socketIO from "socket.io";
import SocketIORedis from "socket.io-redis";
import { User } from "../../../../services/types";
import { JwtType } from "../types";

export interface AdaptersConfiguration {
  types: Array<string>;
  redis: SocketIORedis.SocketIORedisOptions;
}

export interface WebSocketServiceConfiguration {
  server: HttpServer | HttpsServer;
  options?: socketIO.ServerOptions;
  adapters?: AdaptersConfiguration;
  auth?: SocketIOJWTOptions;
}

export interface WebSocketUser extends User {
  token?: DecodedToken;
}

export interface WebSockets {
  [index: string]: WebSocket[];
}

export interface WebSocket extends SocketIO.Socket {
  decoded_token: DecodedToken;
}

export interface WebsocketUserEvent {
  event: string;
  socket: WebSocket;
  user: WebSocketUser;
}

type DecodedToken = JwtType;
