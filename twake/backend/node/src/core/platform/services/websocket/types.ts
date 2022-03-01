import { Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import socketIO, { Socket } from "socket.io";
import { RedisAdapterOptions } from "@socket.io/redis-adapter";
import { User } from "../../../../utils/types";
import { JwtType } from "../types";

export interface AdaptersConfiguration {
  types: Array<string>;
  redis: RedisAdapterOptions;
}

export interface WebSocketServiceConfiguration {
  server: HttpServer | HttpsServer;
  options?: socketIO.ServerOptions | { path: string };
  adapters?: AdaptersConfiguration;
  auth?: { secret: string };
}

export interface WebSocketUser extends User {
  token?: DecodedToken;
}

export interface WebSockets {
  [index: string]: WebSocket[];
}

export interface WebSocket extends Socket {
  decoded_token: DecodedToken;
}

export interface WebsocketUserEvent {
  event: string;
  socket: WebSocket;
  user: WebSocketUser;
}

type DecodedToken = JwtType;
