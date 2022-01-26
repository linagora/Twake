import Logger from 'app/features/global/services/logger-service';
import { InternalConfiguration } from '../../../InitService';
import Observable from '../../../../deprecated/Observable/Observable';
import { TwakeService } from '../../../../features/global/services/twake-service';
import { AuthProvider, InitParameters } from '../AuthProvider';
import Globals from 'app/services/Globals';
import RouterService from 'app/features/router/services/router-service';
import ConsoleAPIClient from 'app/services/Console/ConsoleAPIClient';

export type SignInParameters = {
  username: string;
  password: string;
  remember_me: boolean;
};

export type SignUpParameters = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  username: string;
};

export type SignOutParameters = {
  reload: boolean;
};

@TwakeService('InternalAuthProvider')
export default class InternalAuthProviderService
  extends Observable
  implements AuthProvider<SignInParameters, SignOutParameters, SignUpParameters>
{
  private logger: Logger.Logger;
  private initialized = false;
  private signinIn = false;

  constructor(private configuration?: InternalConfiguration) {
    super();
    this.logger = Logger.getLogger('InternalAuthProvider');
    this.logger.debug('Internal configuration', configuration);
  }

  init(params: InitParameters): this {
    if (this.initialized) {
      this.logger.warn('Already initialized');
      return this;
    }

    this.initialized = true;
    params.onInitialized();
    return this;
  }

  async signIn(params: SignInParameters): Promise<void> {
    if (!params.username || !params.password) {
      return Promise.reject('"username" and "password" are required');
    }

    return new Promise<void>((resolve, reject) => {
      this.signinIn = true;

      ConsoleAPIClient.login(
        {
          email: params.username,
          password: params.password,
          remember_me: params.remember_me,
        },
        true,
      )
        .then(accessToken => (accessToken ? resolve() : reject(new Error('Can not login'))))
        .catch(err => {
          this.logger.error('Error on login', err);
          reject(new Error('Can not login'));
        })
        .finally(() => {
          this.signinIn = false;
        });
    });
  }

  async signOut(params: SignOutParameters): Promise<void> {
    const notOnLogoutRoute = window.location.pathname !== '/logout';

    if (params.reload && notOnLogoutRoute) {
      Globals.window.location.reload();
    } else {
      Globals.window.location.assign(
        `${RouterService.pathnames.LOGIN}${RouterService.history.location.search}`,
      );
    }
  }

  async signUp(params: SignUpParameters) {
    await ConsoleAPIClient.signup(params);
  }
}
