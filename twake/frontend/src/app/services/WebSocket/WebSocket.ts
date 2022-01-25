import WebSocketFactory from './WebSocketFactory';

export type WebsocketRoom = {
  room: string;
  token: string;
};

export enum WebsocketRoomActions {
  Join = 'realtime:join',
  Leave = 'realtime:leave',
}

export enum WebsocketEvents {
  Connected = 'connected',
  Connecting = 'connecting',
  Disconnected = 'disconnected',
  JoinSuccess = 'realtime:join:success',
  JoinError = 'realtime:join:error',
  Resource = 'realtime:resource',
  Event = 'realtime:event',
  Application = 'realtime:application'
}

export type WebSocketListener = {
  token: string;
  callback: <T>(type: WebsocketEvents, event: T) => void;
};

export default WebSocketFactory;
