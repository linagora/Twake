
import Logger from 'app/services/Logger';
import { InternalConfiguration } from '../../../InitService';
import Observable from '../../../Observable/Observable';
import { TwakeService } from '../../../Decorators/TwakeService';
import { AuthProvider, InitParameters } from '../AuthProvider';
import Globals from 'app/services/Globals';
import RouterService from 'app/services/RouterService';
import ConsoleAPIClient from 'app/services/Console/ConsoleAPIClient';

export type SignInParameters = {
  username: string;
  password: string;
  remember_me: boolean;
};

export type SignOutParameters = {
  no_reload: boolean;
};

@TwakeService("InternalAuthProvider")
export default class InternalAuthProviderService extends Observable implements AuthProvider<SignInParameters, SignOutParameters> {
  private logger: Logger.Logger;
  private initialized = false;
  private signinIn = false;

  constructor(private configuration?: InternalConfiguration) {
    super();
    this.logger = Logger.getLogger("InternalAuthProvider");
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
    if (!params.username || !params.password) {
      return Promise.reject('"username" and "password" are required');
    }

    return new Promise<void>((resolve, reject) => {
      this.signinIn = true;

      ConsoleAPIClient.login({
        email: params.username,
        password: params.password,
        remember_me: params.remember_me,
      }, true)
      .then(accessToken => accessToken ? resolve() : reject(new Error('Can not login')))
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
    if (!params.no_reload) {
      Globals.window.location.reload();
    } else {
      RouterService.push(
        `${RouterService.pathnames.LOGIN}${RouterService.history.location.search}`,
      );
    }
  }
}
