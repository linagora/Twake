import Oidc from 'oidc-client';
import { AuthProviderProps } from 'oidc-react';
import environment from '../../environment/environment';
import Api from '../Api';
import InitService from '../InitService';
import Observable from '../Observable/Observable';

type AuthProviderConfiguration = AuthProviderProps;

class LoginService extends Observable {
  private authProviderUserManager: Oidc.UserManager | null = null;

  getAuthProviderConfiguration(): AuthProviderConfiguration {
    const consoleConfiguration = InitService.server_infos?.configuration.accounts.console;

    console.log('here');

    if (!this.authProviderUserManager) {
      this.authProviderUserManager = new Oidc.UserManager({
        authority: consoleConfiguration?.authority || environment.api_root_url,
        client_id: consoleConfiguration?.client_id || 'twake',
        redirect_uri: environment.front_root_url + '/oidccallback',
        response_type: 'code',
        scope: 'openid offline_access',
        post_logout_redirect_uri: environment.front_root_url + '/logout',
        silent_redirect_uri: environment.front_root_url + '/silientrenew',
        automaticSilentRenew: true,
        loadUserInfo: true,
        accessTokenExpiringNotificationTime: 10,
        filterProtocolClaims: true,
      });

      Oidc.Log.logger = console;
      Oidc.Log.level = Oidc.Log.DEBUG;

      this.authProviderUserManager.events.addUserLoaded(async user => {
        console.log('New User Loaded：', user);
        console.log('Acess_token: ', user.access_token);

        const response = await Api.post('users/console/token', { accessToken: user.access_token });

        console.log(response);
      });

      this.authProviderUserManager.events.addAccessTokenExpiring(() => {
        console.log('AccessToken Expiring');
      });

      this.authProviderUserManager.events.addAccessTokenExpired(() => {
        console.log('AccessToken Expired');
        alert('Session expired. Going out!');
        if (this.authProviderUserManager)
          this.authProviderUserManager
            .signoutRedirect()
            .then(function (resp) {
              console.log('signed out', resp);
            })
            .catch(function (err) {
              console.log(err);
            });
      });

      this.authProviderUserManager.events.addSilentRenewError(error => {
        console.error('Silent Renew Error', error);
      });
    }

    return {
      userManager: this.authProviderUserManager,
    };
  }
}

export default new LoginService();
