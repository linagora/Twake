import Observable from 'app/services/Depreciated/observable';
import Api from 'services/Api';
import { TwakeService } from 'services/Decorators/TwakeService';
import Globals from 'services/Globals';
import AuthService from 'services/Auth/AuthService';
import { AuthProvider } from 'services/Auth/provider/AuthProvider';
import LocalStorage from 'services/LocalStorage';
import Collections from 'services/Collections/Collections';
import Application from 'services/Application';
import RouterServices from 'services/RouterService';
import JWT from 'services/JWTService';
import Logger from 'services/Logger';
import WindowState from 'services/utils/window';
import { UserType } from 'app/models/User';

type LoginState = '' | 'app' | 'error' | 'signin' | 'verify_mail' | 'forgot_password' | 'logged_out';
@TwakeService('Login')
class LoginService extends Observable {
  logger: Logger.Logger;
  resolveUser!: (userId: string) => void;
  userIsSet!: Promise<string>;
  _state: LoginState = '';
  login_loading: boolean = false;
  login_error: boolean = false;
  error_secondary_mail_already: boolean = false;
  addmail_token: string = '';
  firstInit: boolean = false;
  currentUserId: string = '';
  emailInit: string = '';
  parsed_error_code: string = '';
  error_code: string = '';
  initialized = false;

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

  async init(): Promise<void> {
    // TODO: Manage states from URL parameters for internal strategy
    // FIXME: THis condition is false, we do not want to do it again and again
    if (this.firstInit) {
      this.getAuthProvider().init();
      // basic auth
      //this.reset();
      await JWT.init();
    } else {
      this.updateUser();
    }
  }

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
        return this.updateUser();
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

  updateUser(callback?: (user: UserType) => void): void {
    this.logger.debug('Updating user');
    if (Globals.store_public_access_get_data) {
      this.firstInit = true;
      this.state = 'logged_out';
      this.notify();
      return;
    }

    this.fetchUser((res) => {
      this.firstInit = true;
      if (res.errors.length > 0) {
        this.logger.debug('Error while fetching user', res.errors);
        this.state = 'logged_out';
        WindowState.reset();
        RouterServices.push(
          RouterServices.addRedirection(
            `${RouterServices.pathnames.LOGIN}${RouterServices.history.location.search}`,
          ),
        );
      } else {
        // TODO: DO not start app each time
        this.startApp(res.data as UserType);
      }

      callback && callback(res.data as UserType);
    });
  }

  private fetchUser(callback: (res: { errors: any[], data: UserType }) => void) {
    Api.post(
      'users/current/get',
      { timezone: new Date().getTimezoneOffset() },
      (res: { errors: any[], data: UserType }) => callback(res),
      false,
      { disableJWTAuthentication: true },
    );
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

  startApp(user: UserType) {
    this.logger.info('Starting application');
    this.setCurrentUser(user);
    Application.start(user);
    this.state = 'app';
    RouterServices.push(RouterServices.generateRouteFromState({}));
  }
}

export default new LoginService();