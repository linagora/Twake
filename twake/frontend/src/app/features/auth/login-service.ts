/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import Logger from 'app/features/global/framework/logger-service';
import Observable from 'app/deprecated/CollectionsV1/observable.js';
import WindowState from 'app/features/global/utils/window';
import Globals from 'app/features/global/services/globals-twake-app-service';
import RouterServices from '../router/services/router-service';
import LocalStorage from 'app/features/global/framework/local-storage-service';
import AuthService from 'app/features/auth/auth-service';
import Application from '../applications/services/application-service';
import { UserType } from 'app/features/users/types/user';
import { Cookies } from 'react-cookie';
import InitService from '../global/services/init-service';

class Login extends Observable {
  // Promise resolved when user is defined
  userIsSet!: Promise<string>;
  resolveUser!: (userId: string) => void;

  logger: Logger.Logger;
  firstInit: boolean;
  // FIXME: Make it private and force to use User.getCurrentId() or similar, but this has not too be exposed and used by others...
  currentUserId = '';
  emailInit: string;
  server_infos_loaded: boolean;
  server_infos: { branding: any; ready: any; auth: any; help_url: boolean };
  error_secondary_mail_already: boolean;
  addmail_token: string;
  external_login_error: boolean;
  state = '';
  login_loading = false;
  login_error = false;
  parsed_error_code: any;
  error_code: any;
  cookies: Cookies;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  recoilUpdateUser = (user: UserType | undefined) => {};

  constructor() {
    super();
    this.reset();
    this.setObservableName('login');
    this.logger = Logger.getLogger('Login');
    this.firstInit = false;
    this.currentUserId = '';
    this.emailInit = '';
    this.server_infos_loaded = false;
    this.server_infos = {
      branding: {},
      ready: {},
      auth: {},
      help_url: false,
    };
    this.parsed_error_code = null;
    this.error_code = null;
    this.error_secondary_mail_already = false;
    this.addmail_token = '';
    this.external_login_error = false;
    this.cookies = new Cookies(['pending-redirect']);
  }

  reset() {
    this.state = '';
    this.login_loading = false;
    this.login_error = false;
    this.resetCurrentUser();
  }

  changeState(state: string) {
    this.state = state;
    this.notify();
  }

  async init(did_wait = false) {
    if (!did_wait) {
      LocalStorage.getItem('api_root_url');
      await this.init(true);
      return;
    }

    if (!AuthService.isInitialized()) {
      this.reset();
      await AuthService.init();

      const redirectUrl = this.cookies.get('pending-redirect');
      if (redirectUrl) {
        console.log('Got pending redirect to', redirectUrl);
        this.cookies.remove('pending-redirect');
        setTimeout(() => {
          document.location.href = redirectUrl;
        }, 500);
      }

      this.updateUser((err, user) => this.logger.debug('User is updated', err, user));
    }
  }

  async pingServer() {
    const infos = await InitService.getServer();
    //We are disconnected
    if (infos?.status !== 'ready') return false;
    return true;
  }

  async updateUser(callback?: (err: Error | null, user?: UserType) => void): Promise<void> {
    if (Globals.store_public_access_get_data) {
      this.firstInit = true;
      this.state = 'logged_out';
      this.notify();
      return;
    }

    AuthService.updateUser(async user => {
      this.logger.debug('User update result', user);
      if (!user) {
        if (!this.pingServer()) {
          //We are disconnected
          console.log('We are disconnected, we will get user again in 10 seconds');
          setTimeout(() => {
            this.updateUser(callback);
          }, 10000);
          return;
        } else {
          console.log('Unable to fetch user even if server is up');
          this.firstInit = true;
          this.state = 'logged_out';
          this.notify();

          WindowState.setPrefix();
          WindowState.setSuffix();
          RouterServices.push(
            RouterServices.addRedirection(
              `${RouterServices.pathnames.LOGIN}${RouterServices.history.location.search}`,
            ),
          );
        }
      } else {
        this.setCurrentUser(user);
        await Application.start(user);
        this.state = 'app';
        this.notify();
        RouterServices.push(RouterServices.generateRouteFromState());
      }

      this.recoilUpdateUser(user);
      callback && callback(null, user);
    });
  }

  setPage(page: string) {
    this.state = page;
    this.notify();
  }

  async signup(params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
  }) {
    return AuthService.signup({
      ...params,
      first_name: params.firstName,
      last_name: params.lastName,
    });
  }

  login(params: any, hide_load = false) {
    if (!hide_load) {
      this.login_loading = true;
    }
    this.login_error = false;
    this.notify();

    AuthService.login(params)
      .then(async result => {
        this.login_loading = false;
        if (!result) {
          this.login_error = true;
          this.notify();
          return;
        }
        await this.updateUser();
      })
      .catch(err => {
        this.logger.error('Can not login', err);
        // TODO display a modal message
      });
  }

  async logout(reload = false) {
    this.resetCurrentUser();
    Application.stop();

    document.body.classList.add('fade_out');

    await AuthService.logout(reload);
  }

  setCurrentUser(user: UserType) {
    this.currentUserId = user.id || '';
    this.resolveUser(this.currentUserId);
  }

  resetCurrentUser() {
    this.currentUserId = '';
    this.userIsSet = new Promise(resolve => (this.resolveUser = resolve));
  }

  getIsPublicAccess() {
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

export default new Login();
