import Globals from '../Globals';
import Logger from '../../features/global/services/logger-service';
import JWT from '../JWTStorage';
import WebSocketService, { WebSocketOptions } from './WebSocketService';

class WebSocketFactory {
  private logger: Logger.Logger;
  private instance!: WebSocketService;

  constructor() {
    this.logger = Logger.getLogger('WebSocketFactory');
  }

  get(): WebSocketService {
    if (!this.instance) {
      this.instance = new WebSocketService(this.getOptions());
    }

    return this.instance;
  }

  private getOptions(): WebSocketOptions {
    return {
      url: Globals.environment.websocket_url,
      authenticateHandler: async () => {
        let token = JWT.getJWT();

        if (JWT.isAccessExpired()) {
          try {
            token = (await JWT.renew()).value;
          } catch (err) {
            this.logger.error('Can not get a new JWT token for WS collection', err);
          }
        }

        return {
          token,
        };
      },
    };
  }
}

export default new WebSocketFactory();
