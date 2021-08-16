import Api from '../Api';
import { TwakeService } from '../Decorators/TwakeService';
import Globals from '../Globals';
import { Login as DeprecatedLogin } from './login';
import AuthService from '../Auth/AuthService';
import { AuthProvider } from '../Auth/provider/AuthProvider';

type ExternalProviderType = 'openid' | 'cas' | string;

@TwakeService('Login')
class LoginService extends DeprecatedLogin {

  async login(params: any): Promise<void> {
    if (this.login_loading) {
      this.logger.debug('Login is already in progress');

      return;
    }

    const provider = this.getAuthProvider();

    if (!provider.signIn) {
      this.logger.info('Selected provider does not support signIn');

      return;
    }

    this.login_error = false;
    this.login_loading = true;

    this.notify();

    return provider.signIn(params)
      .then(() => {
        this.logger.info('SignIn complete');
        return this.init();
      })
      .catch((err: Error) => {
        this.logger.error('Provider signIn Error', err);
        this.login_error = true;
      })
      .finally(() => {
        this.login_loading = false;
        this.notify();
      });
  }

  logout(no_reload: boolean = false): Promise<void> {
    this.clear();

    // TODO: This should be in context and linked to current state
    document.body.classList.add('fade_out');

    return new Promise((resolve, reject) => {
      Api.post('users/logout', {}, async () => {
        try {
          this.getAuthProvider().signOut && (await this.getAuthProvider().signOut!({ no_reload }));
          this.logger.debug('SignOut complete');
          resolve();
        } catch (err) {
          this.logger.error('Error while signin out', err);
          reject(err);
        }
      });
    });
  }

  getAuthProvider(): AuthProvider<any, any> {
    return AuthService.getProvider();
  }

  /**
   * @deprecated external provider login is no more supported this way
   */
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