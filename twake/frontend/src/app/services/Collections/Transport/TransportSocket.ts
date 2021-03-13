import Logger from 'services/Logger';
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

const logger = Logger.getLogger('Collections/Transport/Websocket');
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
    document.addEventListener('focus', () => {
      if (!this.socket?.connected) this.connect();
    });
    setInterval(() => {
      if (new Date().getTime() - this.lastConnection > 30000) {
        this.lastConnection = new Date().getTime();
        this.connect();
      }
    }, 30000);

    (window as any).TransportSocket = this;
  }

  connect() {
    const authenticate = Collections.getOptions().transport?.socket?.authenticate;
    const socketEndpoint = Collections.getOptions().transport?.socket?.url;
    if (!socketEndpoint) {
      return;
    }
    logger.debug('Connecting to websocket', socketEndpoint);

    if (this.socket) {
      if (this.socket.connected) {
        //Already connected
        logger.debug('Already connected to', socketEndpoint);
        return;
      } else {
        this.socket?.close();
        this.socket = null;
      }
    }

    if (!authenticate) {
      logger.error('Cannot start socket without an authentication method');
      return;
    }

    this.socket = io.connect(socketEndpoint || '', {
      path: '/socket',
      reconnectionDelayMax: 10000,
      reconnectionDelay: 2000,
    });
    const socket = this.socket;
    this.socket.on('disconnect', () => {
      logger.debug('Disconnected from websocket, socket.io will reconnect');
    });

    this.socket.on('connect', async () => {
      logger.debug('Connected to websocket, authenticating...');
      socket
        .emit('authenticate', (await authenticate()) || {})
        .on('authenticated', () => {
          logger.debug('Authenticated');
          this.rejoinAll(true);
        })
        .on('unauthorized', (err: any) => {
          logger.warn('Websocket is not authorized', err);
          this.socket?.close();
          this.socket = null;
          //Retry and expect new jwt
          setTimeout(() => {
            this.connect();
          }, 1000);
        });

      socket.on(WebsocketEvents.JoinSuccess, (event: any) => {
        logger.debug('Websocket join success', event.name);
        if (event.name) this.notify(event.name, WebsocketEvents.JoinSuccess, event);
      });
      socket.on(WebsocketEvents.JoinError, (event: any) => {
        logger.debug('Websocket join error', event.name);
        if (event.name) this.notify(event.name, WebsocketEvents.JoinError, event);
      });
      socket.on(WebsocketEvents.Resource, (event: any) => {
        logger.debug('Received resource on room', event.room, event);
        if (event.room) this.notify(event.room, WebsocketEvents.Resource, event);
      });
      socket.on(WebsocketEvents.Event, (event: any) => {
        logger.debug('New Websocket event', event.name);
        if (event.name) this.notify(event.name, WebsocketEvents.Event, event);
      });
    });
  }

  rejoinAll(newlyConnected: boolean = false) {
    Object.keys(this.listeners).forEach(key => {
      Object.keys(this.listeners[key]).forEach(tag => {
        if (this.listeners[key][tag]) {
          newlyConnected && this.listeners[key][tag](WebsocketEvents.Connected, {});
          this.join(key, tag, this.listeners[key][tag]);
        }
      });
    });
  }

  notify(path: string, type: WebsocketEvents, event: any) {
    if (this.listeners[path]) Object.values(this.listeners[path]).forEach(c => c && c(type, event));
  }

  join(path: string, tag: string, callback: (type: WebsocketEvents, event: any) => void) {
    path = path.replace(/\/$/, '');

    logger.debug(`Join room with name ${path} and tag: ${tag}`);

    if (this.socket) {
      this.socket.emit(WebsocketActions.Join, { name: path, token: 'twake' });
    }

    this.listeners[path] = this.listeners[path] || {};
    this.listeners[path][tag] = callback;
  }

  leave(path: string, tag: string) {
    path = path.replace(/\/$/, '');

    this.listeners[path] = this.listeners[path] || {};
    delete this.listeners[path][tag];
    if (Object.keys(this.listeners[path]).length === 0) {
      if (this.socket) {
        logger.debug(`Leave room with name ${path} and tag: ${tag}`);
        this.socket.emit(WebsocketActions.Leave, { name: path });
      }
      delete this.listeners[path];
    }
  }

  emit(path: string, data: any) {
    path = path.replace(/\/$/, '');
    logger.debug(`Emit realtime:event with name ${path}`);
    if (this.socket) {
      this.socket.emit('realtime:event', { name: path, data: data });
    }
  }
}
