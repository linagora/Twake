export type WebSocketResource = {
  room: string;
  name?: string;
};

export type RealtimeResources<T> = {
  resources: T[];
  websockets: WebSocketResource[];
};

export type RealtimeEventAction = 'saved' | 'updated' | 'deleted' | 'event';

export type RealtimeEvent<T, U> = {
  action: RealtimeEventAction;
  room: string;
  path: string;
  type: U;
  resource: T;
};
