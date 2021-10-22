import { EventEmitter } from "events";
import socketIO from "socket.io";
import { TwakeServiceProvider } from "../../framework";
import { User } from "../../../../utils/types";
import { WebsocketUserEvent, WebSocket, WebSocketUser } from "./types";

export default interface WebSocketAPI extends TwakeServiceProvider, EventEmitter {
  getIo(): socketIO.Server;

  isConnected(user: User): boolean;

  onUserConnected(listener: (event: WebsocketUserEvent) => void): this;

  onUserDisconnected(listener: (event: WebsocketUserEvent) => void): this;

  getUser(websocket: WebSocket): WebSocketUser;
}
