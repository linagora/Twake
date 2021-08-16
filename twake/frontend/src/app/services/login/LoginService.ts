import Api from '../Api';
import { TwakeService } from '../Decorators/TwakeService';
import Globals from '../Globals';
import { Login as DeprecatedLogin } from './login';

type ExternalProviderType = 'openid' | 'cas' | string;

@TwakeService('Login')
class LoginService extends DeprecatedLogin {

  loginWithExternalProvider(service?: ExternalProviderType): void {
    this.external_login_error = false;

    if (!service) {
      return;
    }

    if (['openid', 'cas'].includes(service)) {
      Globals.window.location.assign(Api.route(`users/${service}`));
    }
  }
}

export default new LoginService();