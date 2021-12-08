import { TwakeService } from 'app/services/Decorators/TwakeService';
import InitService, { ConsoleConfiguration, InternalConfiguration } from 'app/services/InitService';
import { AuthProvider } from './provider/AuthProvider';
import OIDCAuthProviderService from './provider/oidc/OIDCAuthProviderService';
import InternalAuthProviderService from './provider/internal/InternalAuthProviderService';
import Logger from 'services/Logger';
import AlertManager from '../AlertManager/AlertManager';
import Languages from '../languages/languages';
import { UserType } from 'app/models/User';
import JWT, { JWTDataType } from 'services/JWTStorage';
import UserAPIClient from '../user/UserAPIClient';
import WindowState from 'services/utils/window';
import Application from 'services/Application';
import LocalStorage from 'services/LocalStorage';
import Collections from 'services/Collections/Collections';
import Globals from '../Globals';

type AccountType = 'console' | 'internal';
export type LoginState =
  | ''
  | 'app'
  | 'error'
  | 'signin'
  | 'verify_mail'
  | 'forgot_password'
  | 'logged_out'
  | 'logout';
type InitState = '' | 'initializing' | 'initialized';

@TwakeService('AuthService')
class AuthService {
  private provider: AuthProvider<any, any, any> | null = null;
  private logger: Logger.Logger;
  private initState: InitState = '';
  currentUserId: string = '';

  constructor() {
    this.logger = Logger.getLogger('AuthService');
  }

  getProvider(): AuthProvider<any, any, any> {
    if (this.provider) {
      return this.provider;
    }

    let accountType = this.getAccountType();
    if (!accountType) {
      this.logger.info('No server account configuration');
      this.provider = this.getDefaultProvider();

      return this.provider;
    }

    const config = InitService.server_infos?.configuration?.accounts[accountType];

    if (Globals.environment.env_dev_auth) accountType = Globals.environment.env_dev_auth;

    if (accountType === 'console') {
      this.provider = new OIDCAuthProviderService(config as ConsoleConfiguration);
    } else if (accountType === 'internal') {
      this.provider = new InternalAuthProviderService(config as InternalConfiguration);
    } else {
      throw new Error(`${accountType} is not a valid auth account provider`);
    }

    return this.provider;
  }

  private getDefaultProvider() {
    return new InternalAuthProviderService().init({
      onNewToken: () => {},
      onInitialized: () => {},
    });
  }

  getAccountType(): AccountType | undefined {
    return InitService.server_infos?.configuration?.accounts.type;
  }

  isInitialized() {
    return this.initState === 'initialized';
  }

  /**
   * The session expired and we are not able to slient renew it
   * TODO: This must be done in the LoginService, not here
   */
  onSessionExpired() {
    this.logger.error('Session expired, displaying alert');
    AlertManager.confirm(() => this.logout(), undefined, {
      title: Languages.t('login.session.expired', undefined, 'Session expired'),
      text: Languages.t('login.session.expired.text', undefined, 'Click on OK to reconnect'),
    });
  }

  async init(): Promise<UserType | null> {
    return new Promise(resolve => {
      this.logger.debug(`Initializing state=${this.initState}`);
      if (['initializing', 'initialized'].includes(this.initState)) {
        this.logger.debug(`LoginService is already in ${this.initState}`);
        return;
      }

      this.initState = 'initializing';

      this.getProvider().init({
        onSessionExpired: () => this.onSessionExpired(),
        onNewToken: async token => {
          this.onNewToken(token);

          // TODO: Change the basic auth to return this new token on init
          if (this.initState === 'initializing') {
            const user = await this.comleteInit();
            this.initState = 'initialized';
            resolve(user);
          }
        },
        onInitialized: () => {
          this.logger.info('Auth provider is initialized');
          this.initState = 'initialized';
          resolve(null);
        },
      });
    });
  }

  onNewToken(token?: JWTDataType): void {
    if (token) {
      JWT.updateJWT(token);
      // TODO: Update the user from API?
      // this.updateUser();
    }
  }

  async login(params: any): Promise<UserType | undefined> {
    const provider = this.getProvider();

    if (!provider.signIn) {
      this.logger.info('Selected provider does not support signIn');
      throw new Error('Selected provider does not support signIn');
    }

    let error = false;

    return provider
      .signIn(params)
      .then(() => this.logger.info('SignIn complete'))
      .catch((err: Error) => {
        this.logger.error('Provider signIn Error', err);
        error = true;
      })
      .then(() => {
        if (!error) {
          return UserAPIClient.getCurrent(true);
        }
      });
  }

  async signup(params: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    username: string;
  }) {
    const provider = this.getProvider();

    if (!provider.signUp) {
      this.logger.info('Selected provider does not support signUp');
      throw new Error('Selected provider does not support signUp');
    }

    return provider.signUp(params).then(() => {
      return this.login(params);
    });
  }

  logout(reload: boolean = true): Promise<void> {
    this.clear();

    const shouldReload = reload && window.location.pathname !== '/logout';

    return new Promise(async resolve => {
      try {
        await UserAPIClient.logout();
        this.getProvider().signOut && (await this.getProvider().signOut!({ reload: shouldReload }));
        this.logger.debug('SignOut complete');
        resolve();
      } catch (err) {
        this.logger.error('Error while signin out', err);
        resolve();
      }
    });
  }

  updateUser(callback?: (user?: UserType) => void): void {
    this.logger.debug('Updating user');

    this.fetchUser(user => {
      this.logger.debug(`fetchUser response ${JSON.stringify(user)}`);
      if (!user) {
        this.logger.debug('Error while fetching user');
      }

      callback && callback(user);
    });
  }

  private fetchUser(callback: (user?: UserType) => void) {
    this.logger.debug('fetchUser');
    UserAPIClient.getCurrent(true)
      .then(result => callback(result))
      .catch(err => {
        console.log(err);
        this.logger.error('Error while fetching user', err);
        callback();
      });
  }

  clear() {
    this.resetCurrentUser();
    LocalStorage.clear();
    Collections.clear();
    JWT.clear();
  }

  setCurrentUser(user: UserType) {
    this.logger.debug('Current user', user);
    this.currentUserId = user.id || '';
  }

  resetCurrentUser() {
    this.currentUserId = '';
  }

  reset() {
    this.resetCurrentUser();
  }

  // TODO: Do we need to do it here?
  private async comleteInit(): Promise<UserType | null> {
    this.logger.info('Starting application');
    const user = await UserAPIClient.getCurrent(true);
    this.logger.debug(`fetchUser response ${JSON.stringify(user)}`);

    if (user) {
      this.setCurrentUser(user);
      await Application.start(user);
    }

    return user;
  }
}

export default new AuthService();
