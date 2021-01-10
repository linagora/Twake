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
  private listeners: {
    [path: string]: { [tag: string]: (type: WebsocketEvents, event: any) => void };
  } = {};
  private lastConnection: number = 0;

  constructor(private readonly transport: Transport) {
    document.addEventListener('visibilitychange', () => {
      if (!this.socket?.connected) this.connect();
    });
    setInterval(() => {
      if (new Date().getTime() - this.lastConnection > 30000) {
        this.lastConnection = new Date().getTime();
        if (!this.socket?.connected) this.connect();
      }
    }, 30000);

    (window as any).TransportSocket = this;
  }

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
        Object.keys(this.listeners[key]).forEach(tag => {
          if (this.listeners[key][tag]) {
            this.listeners[key][tag](WebsocketEvents.Disconnected, {});
            this.join(key, tag, this.listeners[key][tag]);
          }
        });
      });
    });

    this.socket.on('connect', () => {
      socket
        .emit('authenticate', Collections.getOptions().transport?.socket?.authenticate || {})
        .on('authenticated', () => {
          Object.keys(this.listeners).forEach(key => {
            Object.keys(this.listeners[key]).forEach(tag => {
              if (this.listeners[key][tag]) {
                this.listeners[key][tag](WebsocketEvents.Connected, {});
                this.join(key, tag, this.listeners[key][tag]);
              }
            });
          });
        })
        .on('unauthorized', (err: any) => {
          console.log('Websocket unauthorized', err);
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
    if (this.listeners[path]) Object.values(this.listeners[path]).forEach(c => c && c(type, event));
  }

  join(path: string, tag: string, callback: (type: WebsocketEvents, event: any) => void) {
    path = path.replace(/\/$/, '');

    if (this.socket) {
      this.socket.emit(WebsocketActions.Join, { name: path, token: 'twake' });
    }

    this.listeners[path] = this.listeners[path] || {};
    this.listeners[path][tag] = callback;
  }

  leave(path: string, tag: string) {
    path = path.replace(/\/$/, '');
    if (this.socket) {
      this.socket.emit(WebsocketActions.Leave, { name: path });
    }

    this.listeners[path] = this.listeners[path] || {};
    delete this.listeners[path][tag];
    if (Object.keys(this.listeners[path]).length === 0) delete this.listeners[path];
  }

  emit(path: string, data: any) {
    path = path.replace(/\/$/, '');
    if (this.socket) {
      this.socket.emit('realtime:event', { name: path, data: data });
    }
  }
}
