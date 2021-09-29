import Observable from 'app/services/Depreciated/observable';
import Api from 'services/Api';
import { TwakeService } from 'services/Decorators/TwakeService';
import Globals from 'services/Globals';
import AuthService from 'services/Auth/AuthService';
import { AuthProvider } from 'services/Auth/provider/AuthProvider';
import LocalStorage from 'services/LocalStorage';
import Collections from 'services/Collections/Collections';
import Application from 'services/Application';
import JWT, { JWTDataType } from 'services/JWTStorage';
import Logger from 'services/Logger';
import WindowState from 'services/utils/window';
import { UserType } from 'app/models/User';
import AlertManager from '../AlertManager/AlertManager';
import Languages from '../languages/languages';
import UserAPIClient from '../user/UserAPIClient';

export type LoginState = '' | 'app' | 'error' | 'signin' | 'verify_mail' | 'forgot_password' | 'logged_out' | 'logout';
type InitState = '' | 'initializing' | 'initialized';
@TwakeService('Login')
class LoginService extends Observable {
  logger: Logger.Logger;
  resolveUser!: (userId: string) => void;
  userIsSet!: Promise<string>;
  login_loading: boolean = false;
  login_error: boolean = false;
  initState: InitState = '';
  currentUserId: string = '';
  private _state: LoginState = '';
  // FIXME: Should be removed
  error_secondary_mail_already: boolean = false;

  constructor() {
    super();
    this.setObservableName('login');
    this.logger = Logger.getLogger('Login');
    this.reset();
  }

  set state(value: LoginState) {
    this._state = value;
    this.notify();
  }

  get state() {
    return this._state;
  }

  isInitialized() {
    return this.initState === 'initialized';
  }

  /**
   * The session expired and we are not able to slient renew it
   */
  onSessionExpired() {
    this.logger.error('Session expired, displaying alert');
    AlertManager.confirm(
      () => this.logout(),
      undefined,
      {
        title: Languages.t('login.session.expired', undefined, 'Session expired'),
        text: Languages.t('login.session.expired.text', undefined, 'Click on OK to reconnect'),
      },
    );
  }

  async init(): Promise<UserType | null> {
    return new Promise((resolve) => {
      this.logger.debug(`Initializing state=${this.initState}`);
      if (['initializing', 'initialized'].includes(this.initState)) {
        this.logger.debug(`LoginService is already in ${this.initState}`);
        return;
      }

      this.initState = 'initializing';

      this.getAuthProvider().init({
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
          this.logger.info("Auth provider is initialized");
          this.initState = 'initialized';
          resolve(null);
        }
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
    if (this.login_loading) {
      this.logger.debug('Login is already in progress');

      //return;
    }

    const provider = this.getAuthProvider();

    if (!provider.signIn) {
      this.logger.info('Selected provider does not support signIn');

      throw new Error('Selected provider does not support signIn');
    }

    this.login_error = false;
    this.login_loading = true;

    this.notify();

    return provider.signIn(params)
      .then(() => {
        this.logger.info('SignIn complete');
      })
      .catch((err: Error) => {
        this.logger.error('Provider signIn Error', err);
        this.login_error = true;
      })
      .then(() => {
        if (!this.login_error) {
          return UserAPIClient.getCurrent(true);
        }
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
          // FIXME: Signout seems to redirect to / and so we loop...
          this.getAuthProvider().signOut && (await this.getAuthProvider().signOut!({ no_reload }));
          this.logger.debug('SignOut complete');
          this.state = 'logged_out';
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

  updateUser(callback?: (user?: UserType) => void): void {
    this.logger.debug('Updating user');
    if (Globals.store_public_access_get_data) {
      //this.initialized = false;
      this.state = 'logged_out';
      this.notify();
      return;
    }

    this.fetchUser(user => {
      this.logger.debug(`fetchUser response ${JSON.stringify(user)}`);
      //this.firstInit = true;
      if (!user) {
      //if (!res.data || res.errors?.length) {
        this.logger.debug('Error while fetching user');
        this.state = 'logged_out';
        WindowState.reset();
        // TODO: Redirect
      }

      callback && callback(user);
    });
  }

  private fetchUser(callback: (user?: UserType) => void) {
    this.logger.debug('fetchUser');
    UserAPIClient.getCurrent(true)
      .then(result => callback(result))
      .catch(err => {
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
    this.currentUserId = user.id || '';
    this.resolveUser(this.currentUserId);
  }

  resetCurrentUser() {
    this.currentUserId = '';
    this.userIsSet = new Promise(resolve => (this.resolveUser = resolve));
  }

  reset() {
    this.state = '';
    this.login_loading = false;
    this.login_error = false;
    this.resetCurrentUser();
  }

  private async comleteInit(): Promise<UserType | null> {
    this.logger.info('Starting application');
    const user = await UserAPIClient.getCurrent(true);
    this.logger.debug(`fetchUser response ${JSON.stringify(user)}`);

    if (user) {
      this.setCurrentUser(user);
      await Application.start(user);
      this.state = 'app';
    }

    return user;
  }

  getIsPublicAccess(): boolean {
    let publicAccess = false;
    const viewParameter = WindowState.findGetParameter('view') || '';
    if (
      (viewParameter && ['drive_publicAccess'].indexOf(viewParameter) >= 0) ||
      Globals.store_public_access_get_data
    ) {
      publicAccess = true;
      Globals.store_public_access_get_data = WindowState.allGetParameter();
    }
    return publicAccess;
  }
}

export default new LoginService();