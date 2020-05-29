import React from 'react';
import Observable from 'services/observable.js';
import Api from 'services/api.js';
import Languages from 'services/languages/languages.js';
import WindowState from 'services/utils/window.js';
import Collections from 'services/Collections/Collections.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Groups from 'services/workspaces/groups.js';
import Notifications from 'services/user/notifications.js';
import Electron from 'services/electron/electron.js';
import CurrentUser from 'services/user/current_user.js';

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
    };

    Globals.window.login = this;
    this.error_secondary_mail_already = false;
    this.addmail_token = '';
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
      this.notify();
    });

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

    var that = this;
    Api.post('users/current/get', { timezone: new Date().getTimezoneOffset() }, function(res) {
      that.firstInit = true;
      if (res.errors.length > 0) {
        if (that.server_infos.use_cas) {
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
        function(res) {
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

  logout() {
    this.currentUserId = null;

    if (this.server_infos.use_cas) {
      document.location = Api.route('users/cas/logout');
      return;
    }

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
        function() {
          if (Globals.isReactNative) {
            that.reset();
            that.state = 'logged_out';
            that.notify();
          } else {
            Globals.window.location.reload();
          }
        },
      );
    });
  }

  startApp(user) {
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
    Workspaces.initSelection();
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
    Api.post('users/recover/mail', data, function(res) {
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
    Api.post('users/recover/verify', data, function(res) {
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
    Api.post('users/recover/password', data, function(res) {
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
    Api.post('users/subscribe/mail', data, function(res) {
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
        function(res) {
          if (res.data.status == 'success') {
            success();
          } else {
            fail();
          }
        },
      );
    });
  }
  subscribeWithCode(username, password, name, firstname, phone, code) {
    var that = this;
    that.login_loading = true;
    that.notify();
    Api.post(
      'users/subscribe/identity',
      {
        username: username,
        password: password,
        name: name,
        firstname: firstname,
        phone: phone,
        code: code,
        token: this.subscribe_token,
      },
      function(res) {
        that.login_loading = false;
        console.log(res);
        if (res.data.status == 'success') {
          that.error_code = false;
          that.login(username, password, 1);
        } else {
          that.error_code = true;
          that.notify();
        }
      },
    );
  }

  subscribe(username, password, name, forename, email, phone, captcha, funct, th) {
    this.login_loading = true;
    this.notify();

    var data = {
      // "code": this.subscribe_code,
      //"token": this.subscribe_token,
      password: password,
      username: username,
      lastname: name,
      firstname: forename,
      mail: email,
      phone: phone,
      recaptcha: captcha,
      language: Languages.getNavigatorLanguage(),
      origin: WindowState.findGetParameter('origin'),
    };
    var that = this;
    that.error_subscribe_password = false;
    that.error_subscribe_username = false;
    that.error_subscribe_mailalreadyused = false;
    this.notify();
    Api.post('users/subscribe/subscribe', data, function(res) {
      if (res.data.status == 'success') {
        funct(th, 0);
      } else {
        console.log(res.errors);
        if (res.errors[0] == 'mailalreadytaken') {
          that.error_subscribe_mailalreadyused = true;
        } else if (res.errors[0] == 'usernamealreadytaken') {
          that.error_subscribe_username = true;
        } else {
          //console.log("implement new error");
        }
        funct(th, 1);
        that.notify();
      }
      that.login_loading = false;
      that.notify();
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
    Api.post('users/subscribe/availability', data, function(res) {
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
    Api.post('users/account/addmail', { mail: mail }, function(res) {
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
    Api.post('users/account/addmailverify', { code: code, token: this.addmail_token }, function(
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
