import LocalStorage from 'services/localStorage';
import LoginService from 'services/login/login';

type JWTDataType = {
  time: 0;
  expiration: number;
  refresh_expiration: number;
  value: string;
  type: 'Bearer';
};

class JWTStorage {
  private timeDelta = 5 * 60;
  private jwtData: JWTDataType = {
    time: 0,
    expiration: 0,
    refresh_expiration: 0,
    value: '',
    type: 'Bearer',
  };

  async init() {
    this.updateJWT(await LocalStorage.getItem('jwt'));
  }

  updateJWT(jwtData: JWTDataType) {
    if (!jwtData) {
      return;
    }
    LocalStorage.setItem('jwt', jwtData);
    this.jwtData = jwtData;
    this.timeDelta = new Date().getTime() / 1000 - jwtData.time;
    this.jwtData.expiration += this.timeDelta - 5 * 60; //Force reduce expiration by 5 minutes
    this.jwtData.refresh_expiration += this.timeDelta - 5 * 60; //Force reduce expiration by 5 minutes
  }

  getAutorizationHeader() {
    return this.jwtData.type + ' ' + this.jwtData.value;
  }

  isAccessExpired() {
    return new Date().getTime() / 1000 - this.jwtData.expiration > 0;
  }

  isRefreshExpired() {
    return new Date().getTime() / 1000 - this.jwtData.refresh_expiration > 0;
  }

  authenticateCall(callback: () => void) {
    if (this.isAccessExpired() && this.jwtData.value) {
      this.jwtData.value = '';
      LoginService.updateUser(callback);
    } else {
      callback();
    }
  }
}

const _JWTStorage = new JWTStorage();
export default _JWTStorage;
