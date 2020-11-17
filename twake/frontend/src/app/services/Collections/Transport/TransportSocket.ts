import Collections from '../Collections';
import Transport from './Transport';
import io from 'socket.io-client';

export enum WebsocketActions {
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
}
export default class TransportSocket {
  private socket: SocketIOClient.Socket | null = null;
  private listeners: { [path: string]: (type: WebsocketEvents, event: any) => void } = {};
  constructor(private readonly transport: Transport) {}

  connect() {
    const socketEndpoint = Collections.getOptions().transport?.socket?.url;
    if (!socketEndpoint) {
      return;
    }

    if (this.socket) {
      //Already connected
      return;
    }

    this.socket = io.connect(socketEndpoint || '', {
      path: '/socket',
      reconnectionDelayMax: 10000,
    });
    const socket = this.socket;
    this.socket.on('disconnect', () => {
      Object.keys(this.listeners).forEach(key => {
        this.listeners[key](WebsocketEvents.Disconnected, {});
        this.join(key, this.listeners[key]);
      });
    });

    this.socket.on('connect', () => {
      socket
        .emit('authenticate', Collections.getOptions().transport?.socket?.authenticate || {})
        .on('authenticated', () => {
          console.log('authenticated');
        })
        .on('unauthorized', (err: any) => {
          console.log('Unauthorize', err);
        });

      Object.keys(this.listeners).forEach(key => {
        this.listeners[key](WebsocketEvents.Connected, {});
        this.join(key, this.listeners[key]);
      });

      socket.on(WebsocketEvents.JoinSuccess, (event: any) => {
        if (event.name) this.notify(event.name, WebsocketEvents.JoinSuccess, event);
      });
      socket.on(WebsocketEvents.JoinError, (event: any) => {
        if (event.name) this.notify(event.name, WebsocketEvents.JoinError, event);
      });
      socket.on(WebsocketEvents.Resource, (event: any) => {
        if (event.room) this.notify(event.room, WebsocketEvents.Resource, event);
      });
      socket.on(WebsocketEvents.Event, (event: any) => {
        if (event.name) this.notify(event.name, WebsocketEvents.Event, event);
      });
    });
  }

  notify(path: string, type: WebsocketEvents, event: any) {
    if (this.listeners[path]) this.listeners[path](type, event);
  }

  join(path: string, callback: (type: WebsocketEvents, event: any) => void) {
    path = path.replace(/\/$/, '');
    if (this.socket) {
      this.socket.emit(WebsocketActions.Join, { name: path, token: 'twake' });
      this.listeners[path] = callback;
    }
  }

  leave(path: string) {
    path = path.replace(/\/$/, '');
    if (this.socket) {
      this.socket.emit(WebsocketActions.Leave, { name: path });
      delete this.listeners[path];
    }
  }

  emit(path: string, data: any) {
    path = path.replace(/\/$/, '');
    if (this.socket) {
      this.socket.emit('realtime:event', { name: path, data: data });
    }
  }
}
