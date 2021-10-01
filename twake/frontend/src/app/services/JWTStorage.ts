import LocalStorage from 'services/LocalStorage';
import LoginService from 'app/services/login/LoginService';
import WindowService from 'services/utils/window';
import ConsoleAPIClient from './Console/ConsoleAPIClient';
import { TwakeService } from './Decorators/TwakeService';
import Logger from './Logger';

export type JWTDataType = {
  time: 0;
  expiration: number;
  refresh_expiration: number;
  value: string;
  refresh: string;
  type: 'Bearer';
};

//Mobile temporary
if ((WindowService.findGetParameter('mobile_login') as any) === '1') {
  LocalStorage.setItem('mobile_login', '1');
}

@TwakeService('JWTStorageService')
class JWTStorage {
  private timeDelta = 5 * 60;
  private jwtData: JWTDataType = {
    time: 0,
    expiration: 0,
    refresh_expiration: 0,
    value: '',
    refresh: '',
    type: 'Bearer',
  };
  logger: Logger.Logger;

  constructor() {
    this.logger = Logger.getLogger("JWT");
    this.init();
  }

  private init() {
    this.updateJWT(LocalStorage.getItem<JWTDataType>('jwt') as JWTDataType, {
      fromLocalStorage: true,
    });
  }

  clear() {
    this.jwtData = {
      time: 0,
      expiration: 0,
      refresh_expiration: 0,
      value: '',
      refresh: '',
      type: 'Bearer',
    };
  }

  updateJWT(jwtData: JWTDataType, options?: { fromLocalStorage: boolean }) {
    if (!jwtData) {
      return;
    }

    //Mobile temporary
    const mobileLogin = LocalStorage.getItem<string>('mobile_login');

    LocalStorage.setItem('mobile_login', '0');
    if (mobileLogin === '1') {
      document.location.replace(
        '/internal/mobile/login/redirect?jwt=' + encodeURI(JSON.stringify(jwtData)),
      );
    }

    this.jwtData = jwtData;
    if (!options?.fromLocalStorage) {
      this.timeDelta = new Date().getTime() / 1000 - jwtData.time;
      this.jwtData.expiration += this.timeDelta - 5 * 60; //Force reduce expiration by 5 minutes
      this.jwtData.refresh_expiration += this.timeDelta - 5 * 60; //Force reduce expiration by 5 minutes

      LocalStorage.setItem('jwt', this.jwtData);
    }
  }

  getJWT() {
    return this.jwtData.value;
  }

  getAutorizationHeader() {
    let value = this.jwtData.value;
    if (this.isAccessExpired()) {
      value = this.jwtData.refresh;
    }
    return `${this.jwtData.type} ${value}`;
  }

  isAccessExpired() {
     const expired = new Date().getTime() / 1000 - this.jwtData.expiration > 0;

    expired && this.logger.debug(`Access token expired, expiration time was ${this.jwtData.expiration}`);

    return expired;
  }

  isRefreshExpired() {
    const expired = new Date().getTime() / 1000 - this.jwtData.refresh_expiration > 0;

    expired && this.logger.debug(`Refresh token expired, expiration time was ${this.jwtData.refresh_expiration}`);

    return expired;
  }

  authenticateCall(callback?: () => void) {
    if (this.isAccessExpired() && LoginService.currentUserId) {
      this.logger.debug('authenticateCall: Updating user because the access token expired');
      LoginService.updateUser(callback);
      return;
    }

    callback && callback();
  }

  async renew(): Promise<JWTDataType> {
    const token = await ConsoleAPIClient.getNewAccessToken();

    if (!token) {
      throw new Error('Can not get a new access token');
    }

    this.updateJWT(token);

    return token;
  }
}

export default new JWTStorage();
