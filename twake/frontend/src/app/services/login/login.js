import Logger from 'app/services/Logger';
import Observable from 'app/services/Depreciated/observable.js';
import Api from 'services/Api';
import Languages from 'services/languages/languages.js';
import WindowState from 'services/utils/window.js';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections.js';
import Collections from 'app/services/Collections/Collections';
import Workspaces from 'services/workspaces/workspaces.js';
import Groups from 'services/workspaces/groups.js';
import Notifications from 'services/user/notifications';
import CurrentUser from 'services/user/current_user.js';
import ws from 'services/websocket.js';
import Globals from 'services/Globals.js';
import InitService from 'services/InitService';
import RouterServices from '../RouterService';
import JWTStorage from 'services/JWTStorage';
import AccessRightsService from 'services/AccessRightsService';
import Environment from 'environment/environment';

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
      help_link: false,
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
      Globals.localStorageGetItem('api_root_url', res => {
        this.init(true);
      });
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

    if (!InitService.server_infos?.auth?.internal && !this.firstInit) {
      //Check I am connected with external sign-in provider
      return this.loginWithExternalProvider((InitService.server_infos?.auth_mode || [])[0]);
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
              ((that.server_infos.auth || {}).openid || {}).use) &&
            !that.external_login_error
          ) {
            document.location = Api.route('users/openid');
            return;
          } else if (
            (res.errors.indexOf('redirect_to_openid') >= 0 ||
              ((that.server_infos.auth || {}).console || {}).use) &&
            !that.external_login_error
          ) {
            let developerSuffix = '';
            if (Environment.env_dev && document.location.host.indexOf('localhost') === 0) {
              developerSuffix = '?localhost=1&port=' + window.location.port;
            }

            document.location = Api.route('users/console/openid' + developerSuffix);
            return;
          } else if (
            (res.errors.indexOf('redirect_to_cas') >= 0 ||
              ((that.server_infos.auth || {}).cas || {}).use) &&
            !that.external_login_error
          ) {
            document.location = Api.route('users/cas/login');
            return;
          }

          that.state = 'logged_out';
          that.notify();

          WindowState.setTitle();
          RouterServices.history.push(
            RouterServices.addRedirection(
              RouterServices.pathnames.LOGIN +
                '?' +
                RouterServices.history.location.search.substr(1),
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
      url = Api.route('users/openid');
    } else if (service === 'cas') {
      url = Api.route('users/cas');
    } else if (service === 'console') {
      let developerSuffix = '';
      if (Environment.env_dev && document.location.host.indexOf('localhost') === 0) {
        developerSuffix = '?localhost=1&port=' + window.location.port;
      }
      url = Api.route('users/console/openid' + developerSuffix);
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

    Globals.getDevice(device => {
      Api.post(
        'users/login',
        {
          username: username,
          password: password,
          remember_me: rememberme,
          device: device,
        },
        function (res) {
          if (res && res.data && res.data.status === 'connected') {
            if (that.waitForVerificationTimeout) {
              clearTimeout(that.waitForVerificationTimeout);
            }
            that.login_loading = false;
            that.init();
            return RouterServices.history.replace(RouterServices.pathnames.LOGIN);
          } else {
            that.login_error = true;
            that.login_loading = false;
            that.notify();
          }
        },
        false,
        { disableJWTAuthentication: true },
      );
    });
  }

  clearLogin() {
    this.currentUserId = null;
    Globals.localStorageClear();
    Collections.clear();
    JWTStorage.clear();
  }

  logout(no_reload = false) {
    var identity_provider = CurrentUser.get()
      ? (CurrentUser.get() || {}).identity_provider
      : 'internal';

    this.clearLogin();

    document.body.classList.add('fade_out');

    Api.post('users/logout', {}, function () {
      if (identity_provider === 'console') {
        var location = Api.route('users/console/openid/logout');
        Globals.window.location = location;
      } else if (identity_provider === 'openid') {
        var location = Api.route('users/openid/logout');
        Globals.window.location = location;
      } else if (identity_provider === 'cas') {
        var location = Api.route('users/cas/logout');
        Globals.window.location = location;
      } else {
        if (!no_reload) {
          Globals.window.location.reload();
        } else {
          RouterServices.history.push(
            RouterServices.pathnames.LOGIN + '?' + RouterServices.history.location.search.substr(1),
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
    RouterServices.history.push(RouterServices.generateRouteFromState({}));

    Notifications.start();
    CurrentUser.start();
    Languages.setLanguage(user.language);
  }

  configureCollections() {
    if (this.currentUserId) {
      Collections.setOptions({
        storageKey: this.currentUserId,
        transport: {
          socket: {
            url: Globals.window.websocket_url,
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
            url: Globals.window.api_root_url + '/internal/services',
            headers: {
              Authorization: JWTStorage.getAutorizationHeader(),
            },
          },
        },
      });
      Collections.connect();
    }
  }

  /**
   * Recover password
   */

  recover(mail, funct, th) {
    var data = {
      email: mail,
    };
    var that = this;
    this.login_loading = true;
    that.error_recover_nosuchmail = false;
    this.notify();
    Api.post('users/recover/mail', data, function (res) {
      if (res.data.token) {
        that.recover_token = res.data.token;

        that.login_loading = false;
        that.notify();
        funct(th);
      } else {
        that.error_recover_nosuchmail = true;
        that.login_loading = false;

        that.notify();
        //appel de funtion error
      }
    });
  }

  recoverCode(code, funct, th) {
    var data = {
      code: code,
      token: this.recover_token,
    };
    var that = this;
    that.error_recover_badcode = false;
    this.login_loading = true;
    this.notify();
    Api.post('users/recover/verify', data, function (res) {
      if (res.data.status === 'success') {
        that.recover_code = code;

        that.login_loading = false;
        that.notify();
        funct(th);
      } else {
        that.error_recover_badcode = true;
        that.login_loading = false;

        that.notify();
      }
    });
  }

  recoverNewPassword(password, password2, funct, th) {
    this.login_loading = true;
    this.notify();

    if (password !== password2 || password.length < 8) {
      this.error_recover_badpasswords = true;
      this.login_loading = false;
      this.notify();
      return;
    }

    var data = {
      code: this.recover_code,
      token: this.recover_token,
      password: password,
    };
    var that = this;
    that.error_recover_badpasswords = false;
    that.error_recover_unknown = false;
    this.notify();
    Api.post('users/recover/password', data, function (res) {
      if (res.data.status === 'success') {
        funct(th);

        that.login_loading = false;
        that.notify();
      } else {
        that.error_recover_unknown = true;
        that.login_loading = false;

        that.notify();
      }
    });
  }

  subscribeMail(username, password, name, firstname, phone, mail, newsletter, cb, th) {
    if (this.doing_subscribe) {
      return;
    }
    var data = {
      email: mail,
      username: username,
      password: password,
      name: name,
      firstname: firstname,
      phone: phone,
      language: Languages.language,
      newsletter: newsletter,
    };
    var that = this;
    that.error_subscribe_mailalreadyused = false;
    that.login_loading = true;
    that.doing_subscribe = true;
    this.notify();
    Api.post('users/subscribe/mail', data, function (res) {
      that.login_loading = false;
      that.doing_subscribe = false;
      that.notify();
      if (res.data.token) {
        that.subscribe_token = res.data.token;
        cb(th, 0);

        that.waitForVerification(username, password, th);
      } else {
        cb(th, 1);
        that.error_subscribe_mailalreadyused = true;
      }
    });
  }

  waitForVerification(username, password, th) {
    if (this.waitForVerificationTimeout) {
      clearTimeout(this.waitForVerificationTimeout);
    }
    this.waitForVerificationTimeout = setTimeout(() => {
      this.waitForVerification(username, password, th);
      this.login(username, password, 1, true);
    }, 2000);
  }

  doVerifyMail(mail, code, token, success, fail) {
    Globals.getDevice(device => {
      Api.post(
        'users/subscribe/doverifymail',
        {
          code: code,
          token: token,
          mail: mail,
          device: device,
        },
        function (res) {
          if (res.data.status === 'success') {
            success();
          } else {
            fail();
          }
        },
      );
    });
  }

  checkMailandUsername(mail, username, callback, th) {
    var that = this;

    that.error_subscribe_username = false;
    that.error_subscribe_mailalreadyused = false;
    var data = {
      mail: mail,
      username: username,
    };
    that.login_loading = true;
    that.notify();
    Api.post('users/subscribe/availability', data, function (res) {
      that.login_loading = false;
      if (res.data.status === 'success') {
        callback(th, 0);
      } else {
        if (res.errors.length === 1 && res.errors[0] === 'mailalreadytaken') {
          callback(th, 1);
          that.error_subscribe_mailalreadyused = true;
        } else if (res.errors.length === 1 && res.errors[0] === 'usernamealreadytaken') {
          callback(th, 2);
          that.error_subscribe_username = true;
        } else {
          callback(th, 3);
          that.error_subscribe_mailalreadyused = true;
          that.error_subscribe_username = true;
        }
      }
      that.notify();
    });
  }

  addNewMail(mail, cb, thot) {
    var that = this;
    that.loading = true;
    that.error_secondary_mail_already = false;
    that.error_code = false;
    that.notify();
    Api.post('users/account/addmail', { mail: mail }, function (res) {
      that.loading = false;

      if (res.errors.indexOf('badmail') > -1) {
        that.error_secondary_mail_already = true;
        that.notify();
      } else {
        that.addmail_token = res.data.token;
        that.notify();
        cb(thot);
      }
    });
  }

  verifySecondMail(mail, code, cb, thot) {
    var that = this;
    that.loading = true;
    that.error_secondary_mail_already = false;
    that.error_code = false;
    that.notify();
    Api.post(
      'users/account/addmailverify',
      { code: code, token: this.addmail_token },
      function (res) {
        that.loading = false;
        if (res.errors.length > 0) {
          that.error_code = true;
          that.notify();
        } else {
          var user = DepreciatedCollections.get('users').find(that.currentUserId);
          user.mails.push({ email: mail, main: false, id: res.data.idMail });
          DepreciatedCollections.get('users').updateObject(user);
          that.error_code = false;
          cb(thot);
          that.notify();
        }
      },
    );
  }
}

const login = new Login();
export default login;
