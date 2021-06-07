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
        userStore: new Oidc.WebStorageStateStore({ store: localStorage }),
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

      Oidc.Log.logger = Logger;
      Oidc.Log.level = Oidc.Log.WARN;

      this.authProviderUserManager.events.addUserLoaded(async user => {
        this.getJWTFromOidcToken(user);
      });

      //This even listener is temporary disabled because of this issue: https://gitlab.ow2.org/lemonldap-ng/lemonldap-ng/-/issues/2358
      this.authProviderUserManager.events.addUserSignedOut(() => {
        Logger.info('Signed out');
        //this.signOut();
      });

      this.authProviderUserManager.events.addAccessTokenExpired(() => {
        this.signOut();
      });

      //This manage the initial sign-in when loading the app
      const authProviderUserManager = this.authProviderUserManager;
      (async () => {
        try {
          await authProviderUserManager.signinRedirectCallback();
          authProviderUserManager.getUser();
        } catch (e) {
          //There is no sign-in response, so we can try to silent login and use refresh token
          try {
            const user = await authProviderUserManager.getUser();
            if (user) {
              const user = await authProviderUserManager.signinSilent();
              this.getJWTFromOidcToken(user);
            } else {
              authProviderUserManager.signinRedirect();
            }
          } catch (e) {
            authProviderUserManager?.signinRedirect();
          }
        }
      })();
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
          setTimeout(() => {
            window.location.reload();
          }, 2000);
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

const authProviderService = new AuthProviderService();
export default authProviderService;
