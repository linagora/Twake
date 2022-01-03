import TransportHTTP from './TransportHTTP';

export interface WebSocketTransport {
  join(
    room: string,
    token: string,
    tag: string,
    onMessage: (type: string, event: any) => void,
  ): void;
  leave(room: string, tag: string): void;
}

export type TransportOptions = {
  rest?: {
    url?: string; //Rest API prefix, like http://localhost:8000/internal
    headers?: () => { [key: string]: string };
  };
  socket: WebSocketTransport;
};

export interface TransportAPI {
  connect(options?: TransportOptions): void;
  getHttp(): TransportHTTP;
  getSocket(): WebSocketTransport;
}
