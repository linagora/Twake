import Observable from 'app/services/Depreciated/observable.js';
import Api from 'services/Api';
import WindowState from 'services/utils/window';
import ws from 'services/websocket.js';
import Globals from 'services/Globals';
import InitService from 'services/InitService';
import RouterServices from '../RouterService';
import JWT from 'app/services/JWTService';
import Environment from 'environment/environment';
import AuthService from 'services/Auth/AuthService';

/**
 * FIXME: Not used, to be removed
 */
export class Login extends Observable {

  async _init() {
    if (AuthService.getAccountType() === 'console') {
      this.logger.debug('Account type does not need local initialization');
      return;
    }

    const cancelAutoLogin =
      !this.firstInit &&
      RouterServices.history.location.pathname === RouterServices.pathnames.LOGIN;
    this.reset();
    await JWT.init();

    ws.onReconnect('login', () => {
      if (this.firstInit && this.currentUserId) {
        this.updateUser();
      }
    });

    var error_code = WindowState.findGetParameter('error_code') ? true : false;
    if (error_code) {
      this.firstInit = true;
      this._state = 'error';
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
      this._state = 'signin';
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
      this._state = 'verify_mail';
      this.notify();
      return;
    }
    var forgotPassword =
      WindowState.findGetParameter('forgotPassword') !== undefined
        ? WindowState.findGetParameter('forgotPassword') === true
        : false;
    if (forgotPassword) {
      this.firstInit = true;
      this._state = 'forgot_password';
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
      this.clear();
      this._state = 'logged_out';
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
          this.login({ username: token.username, password: token.token, remember_me: true });
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

    if (this.getAccountType() !== 'internal' && !this.firstInit) {
      //Check I am connected with external sign-in provider
      //return this.loginWithExternalProvider(
      //  InitService.server_infos?.configuration?.accounts?.type,
      //);
    } else {
      //We can thrust the JWT
      this.updateUser();
    }
  }

  _updateUser(callback = () => {}) {
    if (Globals.store_public_access_get_data) {
      this.firstInit = true;
      this._state = 'logged_out';
      this.notify();
      return;
    }

    Api.post(
      'users/current/get',
      { timezone: new Date().getTimezoneOffset() },
      (res) => {
        this.firstInit = true;
        if (res.errors.length > 0) {
          this.logger.debug('updateUser error', res.errors);
          // TODO: Should be in a specific handler, not in the login
          if (
            (res.errors.indexOf('redirect_to_openid') >= 0 ||
            InitService.server_infos?.configuration?.accounts.type === 'console') &&
            !this.external_login_error
          ) {
            let developerSuffix = '';
            if (Environment.env_dev && document.location.host.indexOf('localhost') === 0) {
              developerSuffix = '?localhost=1&port=' + window.location.port;
            }

            document.location = Api.route('users/console/openid' + developerSuffix);
            return;
          }

          this._state = 'logged_out';
          this.notify();

          WindowState.reset();
          RouterServices.push(
            RouterServices.addRedirection(
              `${RouterServices.pathnames.LOGIN}${RouterServices.history.location.search}`,
            ),
          );
        } else {
          this.startApp(res.data);
        }

        callback && callback();
      },
      false,
      { disableJWTAuthentication: true },
    );
  }
}
