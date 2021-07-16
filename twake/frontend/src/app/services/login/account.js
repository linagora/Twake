import Api from 'services/Api';
import Languages from 'services/languages/languages';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections.js';
import Login from './login';

/**
 * This service is depreciated as Twake will exclusively use Console in the future
 */
class Account {
  notify() {
    Login.notify();
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
    Api.post(
      'users/subscribe/doverifymail',
      {
        code: code,
        token: token,
        mail: mail,
        device: {},
      },
      function (res) {
        if (res.data.status === 'success') {
          success();
        } else {
          fail();
        }
      },
    );
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

const æccount = new Account();
export default æccount;
