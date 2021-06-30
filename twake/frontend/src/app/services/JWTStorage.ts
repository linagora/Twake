import LocalStorage from 'services/LocalStorage';
import LoginService from 'services/login/login';
import WindowService from 'services/utils/window';

export type JWTDataType = {
  time: 0;
  expiration: number;
  refresh_expiration: number;
  value: string;
  refresh: string;
  type: 'Bearer';
};

//Mobile temporary
if ((WindowService.findGetParameter('mobile_login') as any) == '1') {
  LocalStorage.setItem('mobile_login', '1');
}

class JWTStorageClass {
  private timeDelta = 5 * 60;
  private jwtData: JWTDataType = {
    time: 0,
    expiration: 0,
    refresh_expiration: 0,
    value: '',
    refresh: '',
    type: 'Bearer',
  };

  async init() {
    this.updateJWT((await LocalStorage.getItem('jwt')) as JWTDataType, { fromLocalStorage: true });
    (window as any).JWTStorage = this;
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
    LocalStorage.getItem('mobile_login', (res: string) => {
      LocalStorage.setItem('mobile_login', '0');
      if (res == '1') {
        document.location.replace(
          '/internal/mobile/login/redirect?jwt=' + encodeURI(JSON.stringify(jwtData)),
        );
      }
    });

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
    return this.jwtData.type + ' ' + value;
  }

  isAccessExpired() {
    return new Date().getTime() / 1000 - this.jwtData.expiration > 0;
  }

  isRefreshExpired() {
    return new Date().getTime() / 1000 - this.jwtData.refresh_expiration > 0;
  }

  authenticateCall(callback: () => void) {
    if (this.isAccessExpired() && LoginService.currentUserId) {
      LoginService.updateUser(callback);
    } else {
      callback();
    }
  }
}

const JWTStorage = new JWTStorageClass();
export default JWTStorage;
