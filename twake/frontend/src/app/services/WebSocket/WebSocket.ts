import WebSocketFactory from "./WebSocketFactory";

export enum WebsocketRoomActions {
  Join = 'realtime:join',
  Leave = 'realtime:leave',
}

export enum WebsocketEvents {
  Connected = 'connected',
  Disconnected = 'disconnected',
  JoinSuccess = 'realtime:join:success',
  JoinError = 'realtime:join:error',
  Resource = 'realtime:resource',
  Event = 'realtime:event',
};

export type WebSocketListener = <T>(type: WebsocketEvents, event: T) => void;

export default WebSocketFactory;
