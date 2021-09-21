import LocalStorage from 'services/LocalStorage';
import LoginService from 'services/login/LoginService';
import WindowService from 'services/utils/window';
import Logger from 'services/Logger';
import { TwakeService } from './Decorators/TwakeService';

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

// FIXME: This will replace ./JWTStorage.ts
@TwakeService('JWT')
class JWT {
  private timeDelta = 5 * 60;
  private data: JWTDataType;
  private logger: Logger.Logger;

  constructor() {
    this.data = this.getInitialData();
    this.logger = Logger.getLogger('JWT');
    this.init();
  }

  private getInitialData(): JWTDataType {
    return {
      time: 0,
      expiration: 0,
      refresh_expiration: 0,
      value: '',
      refresh: '',
      type: 'Bearer',
    };
  }

  private init() {
    this.logger.debug('Init service');
    this.update(LocalStorage.getItem<JWTDataType>('jwt') as JWTDataType, { fromLocalStorage: true });
  }

  clear() {
    this.data = this.getInitialData();
  }

  update(data: JWTDataType, options?: { fromLocalStorage: boolean }) {
    this.logger.debug('Update JWT', data);
    if (!data) {
      return;
    }

    //Mobile temporary
    const mobileLogin = LocalStorage.getItem<string>('mobile_login');

    LocalStorage.setItem('mobile_login', '0');
    if (mobileLogin === '1') {
      document.location.replace(
        `/internal/mobile/login/redirect?jwt=${encodeURI(JSON.stringify(data))}`,
      );
    }

    this.data = data;
    if (!options?.fromLocalStorage) {
      this.timeDelta = new Date().getTime() / 1000 - data.time;
      this.data.expiration += this.timeDelta - 5 * 60; //Force reduce expiration by 5 minutes
      this.data.refresh_expiration += this.timeDelta - 5 * 60; //Force reduce expiration by 5 minutes

      LocalStorage.setItem('jwt', this.data);
    }

    this.logger.debug("JWT updated", this.data);
  }

  getToken() {
    return this.data.value;
  }

  getAutorizationHeader(): string {
    let value = this.data.value;
    if (this.isAccessExpired()) {
      value = this.data.refresh;
    }

    return `${this.data.type} ${value}`;
  }

  isAccessExpired(): boolean {
    const expired = new Date().getTime() / 1000 - this.data.expiration > 0;

    expired && this.logger.debug(`Access token expired, expiration time was ${this.data.expiration}`);

    return expired;
  }

  isRefreshExpired(): boolean {
    const expired = new Date().getTime() / 1000 - this.data.refresh_expiration > 0;

    expired && this.logger.debug(`Refresh token expired, expiration time was ${this.data.refresh_expiration}`);

    return expired;
  }

  authenticateCall(callback?: () => void): void{
    if (this.isAccessExpired() && LoginService.currentUserId) {
      this.logger.debug('authenticateCall: Updating user');
      LoginService.updateUser(callback);

      return;
    }

    callback && callback();
  }
}

export default new JWT();
