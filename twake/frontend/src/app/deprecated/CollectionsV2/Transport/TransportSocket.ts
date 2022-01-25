import { WebsocketEvents } from 'app/services/WebSocket/WebSocket';
import Logger from 'services/Logger';
import { WebSocketTransport } from './TransportAPI';

export default class TransportSocket implements WebSocketTransport {
  private transport: WebSocketTransport | null = null;
  private logger: Logger.Logger;

  constructor() {
    this.logger = Logger.getLogger('Collections/Transport/Websocket');
  }

  async configure(transport: WebSocketTransport) {
    this.logger.debug('Configure with transport', transport);
    this.transport = transport;
  }

  join(
    path: string,
    token: string,
    tag: string,
    callback: (type: WebsocketEvents | string, event: any) => void,
  ) {
    this.transport?.join(path, token, tag, callback);
  }

  leave(path: string, tag: string) {
    this.transport?.leave(path, tag);
  }
}
