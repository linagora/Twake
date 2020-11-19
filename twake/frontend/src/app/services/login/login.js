import React from 'react';
import Observable from 'services/observable.js';
import Websocket from 'services/websocket.js';
import Api from 'services/api.js';
import Languages from 'services/languages/languages.js';
import WindowState from 'services/utils/window.js';
import Collections from 'services/Collections/Collections.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Groups from 'services/workspaces/groups.js';
import Notifications from 'services/user/notifications.js';
import CurrentUser from 'services/user/current_user.js';
import ws from 'services/websocket.js';

import Globals from 'services/Globals.js';

class Login extends Observable {
  constructor() {
    super();
    this.reset();
    this.setObservableName('login');
    this.firstInit = false;

    this.currentUserId = null;

    this.emailInit = '';

    this.server_infos_loaded = false;
    this.server_infos = {
      branding: {},
      ready: {},
    };

    Globals.window.login = this;
    this.error_secondary_mail_already = false;
    this.addmail_token = '';
    this.external_login_error = false;

    ws.onReconnect('login', () => {
      if (this.firstInit && this.currentUserId) {
        this.updateUser();
      }
    });
  }

  reset() {
    this.state = '';
    this.login_loading = false;
    this.login_error = false;
    this.currentUserId = null;
  }

  changeState(state) {
    this.state = state;
    this.notify();
  }

  init(did_wait) {
    if (!did_wait) {
      Globals.localStorageGetItem('api_root_url', res => {
        this.init(true);
      });
      return;
    }

    this.reset();

    Api.get('core/version', res => {
      if (!res.data) {
        res.data = {};
      }
      this.server_infos = res.data;
      this.server_infos.branding = this.server_infos.branding ? this.server_infos.branding : {};
      this.server_infos_loaded = true;
      Websocket.useOldMode(false);
      Websocket.setPublicKey(this.server_infos.websocket_public_key);

      if (this.server_infos.ready !== true && this.server_infos.ready !== undefined) {
        this.state = 'logged_out';
        this.notify();
        setTimeout(() => {
          this.init();
        }, 1000);
      } else {
        var logout =
          WindowState.findGetParameter('logout') !== undefined
            ? WindowState.findGetParameter('logout') === '1'
            : false;
        if (logout) {
          this.logout(true);
          WindowState.setUrl('/', true);
          return;
        }

        var subscribe =
          WindowState.findGetParameter('subscribe') !== undefined
            ? WindowState.findGetParameter('subscribe') === '1'
            : false;
        if (subscribe) {
          this.firstInit = true;
          this.setPage('signin');
          this.emailInit = WindowState.findGetParameter('mail') || '';
          this.notify();
          return;
        }

        var verifymail =
          WindowState.findGetParameter('verify_mail') !== undefined
            ? WindowState.findGetParameter('verify_mail') === '1'
            : false;
        if (verifymail) {
          this.firstInit = true;
          this.setPage('verify_mail');
          this.notify();
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
          if (external_login_result.token && external_login_result.message == 'success') {
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
            this.external_login_error =
              (external_login_result.message || {}).error || 'Unknown error';
          }
          this.firstInit = true;
          this.notify();
        }

        this.updateUser();
      }
    });
  }

  updateUser() {
    if (Globals.store_public_access_get_data) {
      this.firstInit = true;
      this.state = 'logged_out';
      this.notify();
      return;
    }

    var that = this;
    Api.post('users/current/get', { timezone: new Date().getTimezoneOffset() }, function (res) {
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
        WindowState.setUrl('/', true);
      } else {
        that.startApp(res.data);
      }
    });
  }

  setPage(page) {
    this.state = page;
    this.notify();
  }

  loginWithExternalProvider(service) {
    this.external_login_error = false;

    var url = '';

    if (service == 'openid') {
      url = Api.route('users/openid');
    } else if (service == 'cas') {
      url = Api.route('users/cas');
    }

    Globals.window.location = url;
  }

  login(username, password, rememberme, hide_load) {
    if (!hide_load) {
      this.login_loading = true;
    }
    this.login_error = false;
    this.notify();

    var that = this;

    Globals.getDevice(device => {
      Api.post(
        'users/login',
        {
          _username: username,
          _password: password,
          _remember_me: rememberme,
          device: device,
        },
        function (res) {
          if (res.data.status == 'connected') {
            if (that.waitForVerificationTimeout) {
              clearTimeout(that.waitForVerificationTimeout);
            }

            WindowState.setUrl('/', true);
            that.login_loading = false;
            that.init();
          } else {
            that.login_error = true;
            that.login_loading = false;
            that.notify();
          }
        },
      );
    });
  }

  logout(no_reload) {
    var identity_provider = CurrentUser.get()
      ? (CurrentUser.get() || {}).identity_provider
      : 'internal';

    this.currentUserId = null;

    Globals.localStorageClear();

    if (Globals.isReactNative) {
      Globals.clearCookies();
      Collections.clearAll();
      this.state = '';
      this.notify();
    } else {
      document.body.classList.add('fade_out');
    }

    Globals.getDevice(device => {
      console.log(device);
      var that = this;
      Api.post(
        'users/logout',
        {
          device: device,
        },
        function () {
          if (Globals.isReactNative) {
            that.reset();
            that.state = 'logged_out';
            that.notify();
          } else {
            if (identity_provider == 'openid') {
              var location = Api.route('users/openid/logout');
              Globals.window.location = location;
            } else if (identity_provider == 'cas') {
              var location = Api.route('users/cas/logout');
              Globals.window.location = location;
            } else {
              if (!no_reload) {
                Globals.window.location.reload();
              }
            }
          }
        },
      );
    });
  }

  startApp(user) {
    if (!window.mixpanel) {
      Globals.window.mixpanel_enabled = false;
    }
    if (Globals.window.mixpanel_enabled) {
      window.mixpanel.identify(user.id);
      window.mixpanel.people.set({
        $email: ((user.mails || []).filter(mail => mail.main)[0] || {}).email,
        $first_name: user.firstname,
        $last_name: user.lastname,
        object: JSON.stringify(user),
      });
    }

    if (Globals.window.mixpanel_enabled)
      Globals.window.mixpanel.track(Globals.window.mixpanel_prefix + 'Start App');

    this.currentUserId = user.id;

    Collections.get('users').updateObject(user);
    user.workspaces.forEach(workspace => {
      Workspaces.addToUser(workspace);
      Groups.addToUser(workspace.group);
    });
    if(!Workspaces.currentWorkspaceId){
      Workspaces.initSelection();
    }
    Notifications.start();
    CurrentUser.start();
    Languages.setLanguage(user.language);

    this.state = 'app';
    this.notify();
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
        //that.changeState("RecoverPasswordCode");

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
      if (res.data.status == 'success') {
        that.recover_code = code;
        //                that.changeState("RecoverPasswordNewPassword");

        that.login_loading = false;
        that.notify();
        funct(th);
      } else {
        that.error_recover_badcode = true;
        that.login_loading = false;

        that.notify();
        //appel de function error
      }
    });
  }

  recoverNewPassword(password, password2, funct, th) {
    this.login_loading = true;
    this.notify();

    if (password != password2 || password.length < 8) {
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
      if (res.data.status == 'success') {
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
          if (res.data.status == 'success') {
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
      if (res.data.status == 'success') {
        callback(th, 0);
      } else {
        //console.log(res.errors);
        if (res.errors == 'mailalreadytaken') {
          callback(th, 1);
          that.error_subscribe_mailalreadyused = true;
        } else if (res.errors == 'usernamealreadytaken') {
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
    Api.post('users/account/addmailverify', { code: code, token: this.addmail_token }, function (
      res,
    ) {
      that.loading = false;
      if (res.errors.length > 0) {
        that.error_code = true;
        that.notify();
      } else {
        var user = Collections.get('users').find(that.currentUserId);
        user.mails.push({ email: mail, main: false, id: res.data.idMail });
        Collections.get('users').updateObject(user);
        that.error_code = false;
        cb(thot);
        that.notify();
      }
    });
  }
}

const login = new Login();
export default login;
