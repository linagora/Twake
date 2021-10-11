import Logger from 'services/Logger';
import WebSocketService, { WebsocketEvents } from 'app/services/WebSocket/WebSocketService';
import Collections from '../Collections';
import Transport from './Transport';

const CONNECT_TIMEOUT = 30000;

export default class TransportSocket {
  private socketService: WebSocketService | null = null;
  private lastConnection: number = 0;
  private logger: Logger.Logger;

  constructor(private readonly transport: Transport) {
    this.logger = Logger.getLogger('Collections/Transport/Websocket');
    // TODO: Move addEventListeners and this listener to the application service...
    document.addEventListener('visibilitychange', () => this.connect());
    document.addEventListener('focus', () => this.connect());

    setInterval(() => {
      if (new Date().getTime() - this.lastConnection > CONNECT_TIMEOUT) {
        this.lastConnection = new Date().getTime();
        this.connect();
      }
    }, CONNECT_TIMEOUT);

  }

  async connect() {
    const authenticate = Collections.getOptions().transport?.socket?.authenticate;
    const socketEndpoint = Collections.getOptions().transport?.socket?.url;
    if (!socketEndpoint) {
      return;
    }
    this.logger.debug('Connecting', socketEndpoint);

    if (this.socketService && this.socketService.isConnected()) {
      this.logger.debug('Already connected');
      return;
    }

    const websocket = new WebSocketService({
      authenticateHandler: authenticate || (async () => ({})),
      url: socketEndpoint,
    });

    const connected = await websocket.connect();

    if (connected) {
      this.logger.debug("WS Collection Transport is connected");
      this.lastConnection = new Date().getTime();
      this.socketService = websocket;
    }
  }

  join(path: string, tag: string, callback: (type: WebsocketEvents, event: any) => void) {
    this.socketService?.join(path, tag, callback);
  }

  leave(path: string, tag: string) {
    this.socketService?.leave(path, tag);
  }
}
