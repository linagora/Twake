import io from 'socket.io-client';
import Logger from 'services/Logger';
import { WebsocketEvents, WebSocketListener, WebsocketRoomActions } from './WebSocket';

export type WebSocketOptions = {
  url: string;
  authenticateHandler: () => Promise<any>;
};

const CONNECT_TIMEOUT = 30000;

class WebSocketService {
  private logger: Logger.Logger;
  private lastConnection: number = 0;
  private wsListeners: {
    [path: string]: { [tag: string]: WebSocketListener };
  } = {};
  private socket: SocketIOClient.Socket | null = null;
  private connectTimeout?: ReturnType<typeof setTimeout>;

  constructor(private options: WebSocketOptions) {
    this.logger = Logger.getLogger('WebsocketService');
    this.addEventListeners();
  }

  private addEventListeners(): void {
    const reconnectWhenNeeded = () => {
      if(!this.isConnected()) {
        this.connect();
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        reconnectWhenNeeded();
      }
    });

    document.addEventListener('focus', () => {
      reconnectWhenNeeded();
    });

    setInterval(() => {
      if (new Date().getTime() - this.lastConnection > CONNECT_TIMEOUT) {
        this.lastConnection = new Date().getTime();
        reconnectWhenNeeded();
      }
    }, CONNECT_TIMEOUT);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  async connect(): Promise<boolean> {
    let connected: (value: boolean) => void;
    const promise = new Promise<boolean>(resolve => {
      connected = resolve;
    });

    if (!this.options.url) {
      this.logger.info('Skipping connect to empty URL');
      return false;
    }

    this.logger.debug('Connecting to websocket', this.options.url);

    if (this.socket) {
      if (this.socket.connected) {
        this.logger.debug('Already connected to', this.options.url);
        return false;
      } else {
        this.socket?.close();
        this.socket = null;
      }
    }

    if (!this.options.authenticateHandler) {
      this.logger.error('Cannot connect without an authentication method');
      return false;
    }

    this.socket = io.connect(this.options.url || '', {
      path: '/socket',
      reconnectionDelayMax: 10000,
      reconnectionDelay: 2000,
    });

    this.socket.on('disconnect', () => {
      this.logger.debug('Disconnected from websocket, socket.io will reconnect');
    });

    this.socket.on('connect', async () => {
      this.logger.debug('Connected to websocket, authenticating...');
      if (this.connectTimeout) {
        clearTimeout(this.connectTimeout);
      }

      this.socket
        ?.emit('authenticate', (await this.options.authenticateHandler()) || {})
        .on('authenticated', () => {
          this.logger.debug('Authenticated');
          this.rejoinAll(true);
          connected(true);
        })
        .on('unauthorized', (err: any) => {
          this.logger.warn('Websocket is not authorized', err);
          this.socket?.close();
          this.socket = null;
          //Retry and expect new jwt
          this.connectTimeout = setTimeout(async () => {
            const isConnected = await this.connect();
            if (isConnected) {
              connected(true);
            }
          }, 1000);
        });

      this.socket?.on(WebsocketEvents.JoinSuccess, (event: any) => {
        this.logger.debug('Websocket join success', event.name);
        event.name && this.notify(event.name, WebsocketEvents.JoinSuccess, event);
      });

      this.socket?.on(WebsocketEvents.JoinError, (event: any) => {
        this.logger.debug('Websocket join error', event.name);
        event.name && this.notify(event.name, WebsocketEvents.JoinError, event);
      });

      this.socket?.on(WebsocketEvents.Resource, (event: any) => {
        this.logger.debug('Received resource on room', event.room, event);
        event.room && this.notify(event.room, WebsocketEvents.Resource, event);
      });

      this.socket?.on(WebsocketEvents.Event, (event: any) => {
        this.logger.debug('New Websocket event', event.name);
        event.name && this.notify(event.name, WebsocketEvents.Event, event);
      });
    });

    return promise;
  }

  private rejoinAll(newlyConnected: boolean = false) {
    Object.keys(this.wsListeners).forEach(key => {
      Object.keys(this.wsListeners[key]).forEach(tag => {
        if (this.wsListeners[key][tag]) {
          newlyConnected && this.wsListeners[key][tag](WebsocketEvents.Connected, {});
          this.join(key, tag, this.wsListeners[key][tag]);
        }
      });
    });
  }

  notify(path: string, type: WebsocketEvents, event: any) {
    if (this.wsListeners[path]) {
      Object.values(this.wsListeners[path]).forEach(callback => callback?.(type, event));
    }
  }

  join(path: string, tag: string, callback: <T>(type: WebsocketEvents, event: T) => void) {
    const name = path.replace(/\/$/, '');

    this.logger.debug(`Join room with name='${name}' and tag='${tag}'`);

    if (this.socket) {
      this.socket.emit(WebsocketRoomActions.Join, { name, token: 'twake' });
    }

    this.wsListeners[name] = this.wsListeners[name] || {};
    this.wsListeners[name][tag] = callback;
  }

  leave(path: string, tag: string) {
    const name = path.replace(/\/$/, '');

    this.wsListeners[name] = this.wsListeners[name] || {};
    delete this.wsListeners[name][tag];

    if (Object.keys(this.wsListeners[name]).length === 0) {
      if (this.socket) {
        this.logger.debug(`Leave room with name='${name}' and tag='${tag}'`);
        this.socket.emit(WebsocketRoomActions.Leave, { name });
      }
      delete this.wsListeners[name];
    }
  }

  emit<T>(path: string, data: T) {
    const name = path.replace(/\/$/, '');
    this.logger.debug(`Emit realtime:event with name='${name}'`);

    // TODO: Buffer
    if (this.socket) {
      this.socket.emit('realtime:event', { name, data });
    }
  }
}

export default WebSocketService;