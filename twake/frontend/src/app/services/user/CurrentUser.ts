import $ from 'jquery';
import Login from 'services/login/login';
import Collections from 'app/services/Depreciated/Collections/Collections';
import Api from 'services/Api';
import ws from 'services/websocket';
import Observable from 'app/services/Depreciated/observable';
import SecuredConnection from 'app/services/Depreciated/Collections/SecuredConnection';
import Number from 'services/utils/Numbers';
import ConfiguratorsManager from 'services/Configurators/ConfiguratorsManager';
import AlertManager from 'services/AlertManager/AlertManager';
import Languages from 'services/languages/languages';
import JWTStorage from 'services/JWTStorage';
import Globals from 'services/Globals';

class CurrentUser extends Observable {
  loading: boolean;
  errorUsernameExist: boolean;
  errorUnkown: boolean;
  errorBadImage: boolean;
  unique_connection_id: string;
  updates_connection!: SecuredConnection;
  badNewPassword: boolean;
  error_identity_badimage: boolean;
  badOldPassword: boolean;
  error_secondary_mail_already: boolean;
  error_code: boolean;
  addmail_token: string;

  constructor() {
    super();
    this.setObservableName('currentUserService');
    this.loading = false;
    this.errorUsernameExist = false;
    this.errorUnkown = false;
    this.errorBadImage = false;
    this.badNewPassword = false;
    this.unique_connection_id = Number.unid();
    this.error_identity_badimage = false;
    this.badOldPassword = false;
    this.error_secondary_mail_already = false;
    this.error_code = false;
    this.addmail_token = "";

    (Globals.window as any).currentUser = this;
  }

  start() {
    //This connexion will be used for crypted personnal events like apps configurators
    this.updates_connection = new SecuredConnection(
      'updates/' + Login.currentUserId,
      { type: 'updates' },
      (type: string, data: any) => {
        if (type === 'event' && data.action === 'configure') {
          if (data.connection_id === this.unique_connection_id) {
            ConfiguratorsManager.openConfigurator(data.application, data.form, data.hidden_data);
          }
        }
        if (type === 'event' && data.action === 'close_configure') {
          if (data.connection_id === this.unique_connection_id) {
            ConfiguratorsManager.closeConfigurator(data.application);
          }
        }
      },
    );
  }

  get() {
    return Collections.get('users').find(Login.currentUserId);
  }

  updateStatusIcon(status: any) {
    const data = {
      status,
    };
    const update = {
      id: Login.currentUserId,
      status_icon: status,
    };
    Collections.get('users').updateObject(update);
    Api.post('users/account/update_status', data, () => {
      ws.publish('users/' + Login.currentUserId, { user: update });
    });
  }

  updateTutorialStatus(key: string, set_false?: unknown) {
    const user = this.get();
    if (!user) {
      return;
    }
    if (!user.tutorial_status || user.tutorial_status.length === 0) {
      user.tutorial_status = {};
    }
    if (user.tutorial_status[key] === (set_false ? false : true)) {
      return;
    }
    user.tutorial_status[key] = set_false ? false : true;
    Collections.get('users').updateObject(this.get());

    const data = {
      status: user.tutorial_status,
    };
    Api.post('users/account/set_tutorial_status', data, () => {
      ws.publish('users/' + Login.currentUserId, {
        user: { tutorial_status: user.tutorial_status },
      });
    });
  }

  updateUserName(username: string) {
    const that = this;
    const update = {
      id: Login.currentUserId,
      username: username,
    };
    Collections.get('users').updateObject(update);
    that.loading = true;
    that.notify();
    Api.post('users/account/username', { username }, (res: any) => {
      that.loading = false;
      if (res.errors.length === 0) {
        ws.publish('users/' + Login.currentUserId, { user: update });
        that.errorUsernameExist = false;
      } else {
        that.errorUsernameExist = true;
      }
      that.notify();
    });
  }

  updateidentity(lastname: string, firstname: string, thumbnail: string) {
    this.loading = true;
    this.notify();

    const route = Globals.api_root_url + '/ajax/users/account/identity';
    const data = new FormData();

    if (thumbnail) {
      data.append('thumbnail', thumbnail);
    }
    
    data.append('firstname', firstname || '');    
    data.append('lastname', lastname || '');

    this.updateTutorialStatus('has_identity');

    const that = this;

    $.ajax({
      url: route,
      type: 'POST',
      data: data,
      cache: false,
      contentType: false,
      processData: false,
      xhrFields: {
        withCredentials: true,
      },
      headers: {
        Authorization: JWTStorage.getAutorizationHeader(),
      },
      xhr: function () {
        const myXhr = $.ajaxSettings.xhr();
        myXhr.onreadystatechange = function () {
          if (myXhr.readyState === XMLHttpRequest.DONE) {
            that.loading = false;
            const resp = JSON.parse(myXhr.responseText);
            if (resp.errors.indexOf('badimage') > -1) {
              that.error_identity_badimage = true;
              that.notify();
            } else {
              const update = {
                id: Login.currentUserId,
                firstname,
                lastname,
                thumbnail: '',
              };
              if (!thumbnail) {
                update.thumbnail = resp.data.thumbnail || '';
              }
              Collections.get('users').updateObject(update);
              ws.publish('users/' + Login.currentUserId, { user: update });
              that.notify();
            }
          }
        };
        return myXhr;
      },
    });
  }

  updatePassword(oldPassword: string, password: string, password1: string) {
    oldPassword = oldPassword || '';
    password = password || '';
    password1 = password1 || '';
    if (password !== password1 || password.length < 8) {
      this.badNewPassword = true;
      this.notify();
      return;
    }
    const that = this;
    that.loading = true;
    that.notify();
    Api.post('users/account/password', { old_password: oldPassword, password: password }, (res: any) => {
      that.loading = false;
      if (res.errors.length === 0) {
        that.badNewPassword = false;
        that.badOldPassword = false;

        AlertManager.alert(() => {}, {
          text: Languages.t(
            'services.user.update_password_alert',
            [],
            'Votre mot de passe a été mis à jour.',
          ),
        });
      } else {
        that.badNewPassword = false;
        that.badOldPassword = true;
      }
      that.notify();
    });
  }

  addNewMail(mail: string, cb: (arg: any) => any, thot: any) {
    const that = this;
    that.loading = true;
    that.error_secondary_mail_already = false;
    that.error_code = false;
    that.notify();
    Api.post('users/account/addmail', { mail: mail }, (res: any) => {
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

  makeMainMail(mailId: string) {
    const that = this;
    that.loading = true;
    that.notify();
    Api.post('users/account/mainmail', { mail: mailId }, (res: any) => {
      if (res.errors.length === 0) {
        const mails = Collections.get('users').find(Login.currentUserId).mails;
        for (let i = 0; i < mails.length; i++) {
          mails[i].main = false;
          if (mails[i].id === mailId) {
            mails[i].main = true;
          }
        }
        const update = {
          id: Login.currentUserId,
          mails: mails,
        };
        Collections.get('users').updateObject(update);
      }
      that.loading = false;
      that.notify();
    });
  }

  removeMail(mailId: string) {
    const that = this;
    that.loading = true;
    that.notify();
    Api.post('users/account/removemail', { mail: mailId }, (res: any) => {
      if (res.errors.length === 0) {
        const mails = Collections.get('users').find(Login.currentUserId).mails;
        const newMails = [];
        for (let i = 0; i < mails.length; i++) {
          if (mails[i].id !== mailId) {
            newMails.push(mails[i]);
          }
        }
        const update = {
          id: Login.currentUserId,
          mails: newMails,
        };
        Collections.get('users').updateObject(update);
      }
      that.loading = false;
      that.notify();
    });
  }
}

export default new CurrentUser();
