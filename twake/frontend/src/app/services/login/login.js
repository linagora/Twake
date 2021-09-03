import Logger from 'app/services/Logger';
import Observable from 'app/services/Depreciated/observable.js';
import Api from 'services/Api';
import Languages from 'services/languages/languages';
import WindowState from 'services/utils/window';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections.js';
import Collections from 'app/services/Collections/Collections';
import Workspaces from 'services/workspaces/workspaces.js';
import Groups from 'services/workspaces/groups.js';
import UserNotifications from 'app/services/user/UserNotifications';
import CurrentUser from 'app/services/user/CurrentUser';
import ws from 'services/websocket.js';
import Globals from 'services/Globals';
import InitService from 'services/InitService';
import RouterServices from '../RouterService';
import JWTStorage from 'services/JWTStorage';
import AccessRightsService from 'services/AccessRightsService';
import Environment from 'environment/environment';
import LocalStorage from 'services/LocalStorage';
import authProviderService from './AuthProviderService';

class Login extends Observable {
  // Promise resolved when user is defined
  userIsSet;

  constructor() {
    super();
    this.reset();
    this.setObservableName('login');
    this.logger = Logger.getLogger('Login');
    this.firstInit = false;
    this.currentUserId = null;
    this.emailInit = '';
    this.server_infos_loaded = false;
    this.server_infos = {
      branding: {},
      ready: {},
      auth: {},
      help_url: false,
    };

    Globals.window.login = this;
    this.error_secondary_mail_already = false;
    this.addmail_token = '';
    this.external_login_error = false;
  }

  reset() {
    this.state = '';
    this.login_loading = false;
    this.login_error = false;
    this.resetCurrentUser();
  }

  changeState(state) {
    this.state = state;
    this.notify();
  }

  async init(did_wait = false) {
    if (!did_wait) {
      LocalStorage.getItem('api_root_url');
      this.init(true);

      return;
    }

    if (InitService.server_infos?.configuration?.accounts?.type === 'console') {
      return;
    }

    const cancelAutoLogin =
      !this.firstInit &&
      RouterServices.history.location.pathname === RouterServices.pathnames.LOGIN;
    this.reset();
    await JWTStorage.init();

    ws.onReconnect('login', () => {
      if (this.firstInit && this.currentUserId) {
        this.updateUser();
      }
    });

    var error_code = WindowState.findGetParameter('error_code') ? true : false;
    if (error_code) {
      this.firstInit = true;
      this.setPage('error');
      this.error_code = WindowState.findGetParameter('error_code') || '';
      try {
        this.parsed_error_code = JSON.parse(WindowState.findGetParameter('error_code')).error;
      } catch (e) {
        this.parsed_error_code = 'Unable to parse error.';
      }
      this.notify();
      return;
    }

    var subscribe =
      WindowState.findGetParameter('subscribe') !== undefined
        ? WindowState.findGetParameter('subscribe') === true
        : false;
    if (subscribe) {
      this.firstInit = true;
      this.setPage('signin');
      this.emailInit = WindowState.findGetParameter('mail') || '';
      this.notify();
      return;
    }
    var verifymail =
      WindowState.findGetParameter('verifyMail') !== undefined
        ? WindowState.findGetParameter('verifyMail') === true
        : false;
    if (verifymail) {
      this.firstInit = true;
      this.setPage('verify_mail');
      this.notify();
      return;
    }
    var forgotPassword =
      WindowState.findGetParameter('forgotPassword') !== undefined
        ? WindowState.findGetParameter('forgotPassword') === true
        : false;
    if (forgotPassword) {
      this.firstInit = true;
      this.setPage('forgot_password');
      this.notify();
      return;
    }
    var logoutNow =
      WindowState.findGetParameter('logout') !== undefined
        ? WindowState.findGetParameter('logout') === true
        : false;
    if (logoutNow) {
      this.firstInit = true;
      this.logout();
    }

    var autologin =
      WindowState.findGetParameter('auto') !== undefined
        ? WindowState.findGetParameter('auto') === true
        : false;
    if (cancelAutoLogin && !autologin) {
      this.firstInit = true;
      this.clearLogin();
      this.setPage('logged_out');
      return;
    }

    var external_login_result =
      WindowState.findGetParameter('external_login') !== undefined
        ? WindowState.findGetParameter('external_login')
        : false;
    try {
      external_login_result = JSON.parse(external_login_result);
    } catch (err) {
      console.error(err);
      external_login_result = false;
    }
    if (external_login_result) {
      if (external_login_result.token && external_login_result.message === 'success') {
        //Login with token
        try {
          const token = JSON.parse(external_login_result.token);
          this.login(token.username, token.token, true, true);
          this.firstInit = true;
          return;
        } catch (err) {
          console.error(err);
          this.external_login_error = 'Unknown error';
        }
      } else {
        this.external_login_error = (external_login_result.message || {}).error || 'Unknown error';
      }
      this.firstInit = true;
      this.notify();
    }

    if (InitService.server_infos?.configuration?.accounts?.type !== 'internal' && !this.firstInit) {
      //Check I am connected with external sign-in provider
      return this.loginWithExternalProvider(
        InitService.server_infos?.configuration?.accounts?.type,
      );
    } else {
      //We can thrust the JWT
      this.updateUser();
    }
  }

  updateUser(callback) {
    if (Globals.store_public_access_get_data) {
      this.firstInit = true;
      this.state = 'logged_out';
      this.notify();
      return;
    }

    var that = this;
    Api.post(
      'users/current/get',
      { timezone: new Date().getTimezoneOffset() },
      function (res) {
        that.firstInit = true;
        if (res.errors.length > 0) {
          if (
            (res.errors.indexOf('redirect_to_openid') >= 0 ||
              that.server_infos.configuration?.accounts.type === 'console') &&
            !that.external_login_error
          ) {
            let developerSuffix = '';
            if (Environment.env_dev && document.location.host.indexOf('localhost') === 0) {
              developerSuffix = '?localhost=1&port=' + window.location.port;
            }

            document.location = Api.route('/ajax/users/console/openid' + developerSuffix);
            return;
          }

          that.state = 'logged_out';
          that.notify();

          WindowState.setPrefix();
          WindowState.setSuffix();
          RouterServices.push(
            RouterServices.addRedirection(
              `${RouterServices.pathnames.LOGIN}${RouterServices.history.location.search}`,
            ),
          );
        } else {
          that.startApp(res.data);
        }

        callback && callback();
      },
      false,
      { disableJWTAuthentication: true },
    );
  }

  setPage(page) {
    this.state = page;
    this.notify();
  }

  loginWithExternalProvider(service) {
    this.external_login_error = false;

    var url = '';

    if (service === 'openid') {
      url = Api.route('/ajax/users/openid');
    } else if (service === 'cas') {
      url = Api.route('/ajax/users/cas');
    } else if (service === 'console') {
      return;
    } else {
      return;
    }

    Globals.window.location = url;
  }

  login(username, password, rememberme, hide_load) {
    if (!hide_load) {
      this.login_loading = true;
    }
    this.login_error = false;
    this.notify();

    const that = this;

    Api.post(
      'users/login',
      {
        username: username,
        password: password,
        remember_me: rememberme,
        device: {},
      },
      function (res) {
        if (res && res.data && res.data.status === 'connected') {
          if (that.waitForVerificationTimeout) {
            clearTimeout(that.waitForVerificationTimeout);
          }
          that.login_loading = false;
          that.init();
          return RouterServices.replace(RouterServices.pathnames.LOGIN);
        } else {
          that.login_error = true;
          that.login_loading = false;
          that.notify();
        }
      },
      false,
      { disableJWTAuthentication: true },
    );
  }

  clearLogin() {
    this.currentUserId = null;
    LocalStorage.clear();
    Collections.clear();
    JWTStorage.clear();
  }

  logout(no_reload = false) {
    var identity_provider = CurrentUser.get()
      ? (CurrentUser.get() || {}).identity_provider
      : 'internal';

    this.clearLogin();

    document.body.classList.add('fade_out');

    Api.post('/ajax/users/logout', {}, function () {
      if (identity_provider === 'console') {
        authProviderService.signOut();
      } else {
        if (!no_reload) {
          Globals.window.location.reload();
        } else {
          RouterServices.push(
            `${RouterServices.pathnames.LOGIN}${RouterServices.history.location.search}`,
          );
        }
      }
    });
  }

  setCurrentUser(user) {
    this.currentUserId = user.id;
    this.resolveUser(this.currentUserId);
  }

  resetCurrentUser() {
    this.currentUserId = null;
    this.userIsSet = new Promise(resolve => (this.resolveUser = resolve));
  }

  startApp(user) {
    this.logger.info('Starting application for user', user.id);
    this.setCurrentUser(user);
    this.configureCollections();

    DepreciatedCollections.get('users').updateObject(user);

    AccessRightsService.resetLevels();

    user.workspaces.forEach(workspace => {
      Workspaces.addToUser(workspace);
      Groups.addToUser(workspace.group);
    });

    this.state = 'app';
    this.notify();
    RouterServices.push(RouterServices.generateRouteFromState({}));

    UserNotifications.start();
    CurrentUser.start();
    Languages.setLanguage(user.language);
  }

  configureCollections() {
    if (this.currentUserId) {
      Collections.setOptions({
        storageKey: this.currentUserId,
        transport: {
          socket: {
            url: Globals.environment.websocket_url,
            authenticate: async () => {
              let token = JWTStorage.getJWT();
              if (JWTStorage.isAccessExpired()) {
                await new Promise(resolve => {
                  this.updateUser(resolve);
                });
                token = JWTStorage.getJWT();
              }
              return {
                token,
              };
            },
          },
          rest: {
            url: Globals.api_root_url + '/internal/services',
            headers: {
              Authorization: JWTStorage.getAutorizationHeader(),
            },
          },
        },
      });
      Collections.connect();
    }
  }

  getIsPublicAccess() {
    let publicAccess = false;
    const viewParameter = WindowState.findGetParameter('view') || '';
    if (
      (viewParameter && ['drive_publicAccess'].indexOf(viewParameter) >= 0) ||
      Globals.store_publicAccess_get_data
    ) {
      publicAccess = true;
      Globals.store_publicAccess_get_data = WindowState.allGetParameter();
    }
    return publicAccess;
  }
}

const login = new Login();
export default login;
