import Oidc from 'oidc-client';
import { AuthProviderProps } from 'oidc-react';
import environment from '../../environment/environment';
import Api from '../Api';
import InitService from '../InitService';
import JWTStorage, { JWTDataType } from '../JWTStorage';
import Observable from '../Observable/Observable';
import LoginService from './login';
import Logger from 'app/services/Logger';

type AuthProviderConfiguration = AuthProviderProps;

class AuthProviderService extends Observable {
  private authProviderUserManager: Oidc.UserManager | null = null;

  getAuthProviderConfiguration(): AuthProviderConfiguration {
    const consoleConfiguration = InitService.server_infos?.configuration.accounts.console;

    (window as any).AuthProviderService = this;

    if (!this.authProviderUserManager) {
      this.authProviderUserManager = new Oidc.UserManager({
        authority: consoleConfiguration?.authority || environment.api_root_url,
        client_id: consoleConfiguration?.client_id || 'twake',
        redirect_uri: environment.front_root_url + '/oidccallback',
        response_type: 'code',
        scope: 'openid profile email address phone offline_access',
        post_logout_redirect_uri: environment.front_root_url + '/logout',
        silent_redirect_uri: environment.front_root_url + '/oidcsilientrenew',
        automaticSilentRenew: true,
        loadUserInfo: true,
        accessTokenExpiringNotificationTime: 60,
        filterProtocolClaims: true,
      });

      Oidc.Log.logger = console;
      Oidc.Log.level = Oidc.Log.DEBUG;

      this.authProviderUserManager.events.addUserLoaded(async user => {
        Logger.info('User loaded');
        this.getJWTFromOidcToken(user);
      });

      this.authProviderUserManager.events.addAccessTokenExpiring(() => {
        Logger.info('AccessToken Expiring');
      });

      this.authProviderUserManager.events.addUserSignedOut(() => {
        Logger.info('Signed out');
      });

      this.authProviderUserManager.events.addUserSignedIn(() => {
        Logger.info('Signed in');
      });

      this.authProviderUserManager.events.addAccessTokenExpired(() => {
        Logger.info('AccessToken Expired');
        this.signOut();
      });

      this.authProviderUserManager.events.addSilentRenewError(error => {
        console.error('Silent Renew Error', error);
      });

      this.authProviderUserManager
        .getUser()
        .then(user => {
          this.getJWTFromOidcToken(user);
        })
        .catch(() => {
          Logger.info('User not already logged in (error while retrieving it)');
        });
    }

    return {
      userManager: this.authProviderUserManager,
    };
  }

  async signOut() {
    if (this.authProviderUserManager)
      this.authProviderUserManager
        .signoutRedirect()
        .then(function (resp) {
          JWTStorage.clear();
          window.location.reload();
        })
        .catch(function (err) {
          Logger.info(err);
        });
  }

  async getJWTFromOidcToken(user: Oidc.User | null) {
    if (!user) {
      Logger.info('Cannot getJWTFromOidcToken with a null user');
      return;
    }
    const response = (await Api.post('users/console/token', {
      access_token: user.access_token,
    })) as { access_token: JWTDataType };
    JWTStorage.updateJWT(response.access_token);
    LoginService.updateUser(() => {});
  }
}

export default new AuthProviderService();
