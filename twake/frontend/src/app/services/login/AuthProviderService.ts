import Oidc from 'oidc-client';
import { AuthProviderProps } from 'oidc-react';
import environment from '../../environment/environment';
import Api from '../Api';
import InitService from '../InitService';
import JWTStorage, { JWTDataType } from '../JWTStorage';
import Observable from '../Observable/Observable';
import LoginService from './login';
import Logger from 'app/services/Logger';
import { getAsFrontUrl } from '../utils/URLUtils';
import AlertManager from 'services/AlertManager/AlertManager';
import languages from '../languages/languages';

type AuthProviderConfiguration = AuthProviderProps;

class AuthProviderService extends Observable {
  private authProviderUserManager: Oidc.UserManager | null = null;

  getAuthProviderConfiguration(): AuthProviderConfiguration {
    const consoleConfiguration = InitService.server_infos?.configuration?.accounts.console;

    (window as any).AuthProviderService = this;

    if (!this.authProviderUserManager) {
      this.authProviderUserManager = new Oidc.UserManager({
        userStore: new Oidc.WebStorageStateStore({ store: localStorage }),
        authority: consoleConfiguration?.authority || environment.api_root_url,
        client_id: consoleConfiguration?.client_id || 'twake',
        redirect_uri: getAsFrontUrl('/oidccallback'),
        response_type: 'code',
        scope: 'openid profile email address phone offline_access',
        post_logout_redirect_uri: getAsFrontUrl('/signout'),
        silent_redirect_uri: getAsFrontUrl('/oidcsilientrenew'),
        automaticSilentRenew: true,
        loadUserInfo: true,
        accessTokenExpiringNotificationTime: 60,
        filterProtocolClaims: true,
      });

      Oidc.Log.logger = Logger;
      Oidc.Log.level = Oidc.Log.WARN;

      //For logout if signout or logout endpoint called
      if (['/signout', '/logout'].includes(document.location.pathname)) {
        this.signOut();
      }

      this.authProviderUserManager.events.addUserLoaded(async user => {
        this.getJWTFromOidcToken(user);
      });

      this.authProviderUserManager.events.addAccessTokenExpired(() => {
        this.silentLogin();
      });

      //This even listener is temporary disabled because of this issue: https://gitlab.ow2.org/lemonldap-ng/lemonldap-ng/-/issues/2358
      this.authProviderUserManager.events.addUserSignedOut(() => {
        Logger.info('Signed out');
        //this.signOut();
      });

      //This manage the initial sign-in when loading the app
      if (this.enforceFrontendUrl()) this.silentLogin();
    }

    return {
      userManager: this.authProviderUserManager,
    };
  }

  //Redirect to valid frontend url to make sure oidc will work as expected
  enforceFrontendUrl() {
    const frontUrl = (getDomain(environment.front_root_url || '') || '').toLocaleLowerCase();
    if (frontUrl && document.location.host.toLocaleLowerCase() !== frontUrl) {
      document.location.replace(
        document.location.protocol +
          '//' +
          getDomain(environment.front_root_url) +
          '/' +
          document.location.pathname +
          document.location.search +
          document.location.hash,
      );
      return false;
    }
    return true;
  }

  async silentLogin() {
    const authProviderUserManager = this.authProviderUserManager;
    if (authProviderUserManager) {
      (async () => {
        //Try to use the in-url sign-in response from oidc if exists
        try {
          await authProviderUserManager.signinRedirectCallback();
          authProviderUserManager.getUser();
        } catch (e) {
          //There is no sign-in response, so we can try to silent login and use refresh token
          try {
            //First we try to see if we know this user
            let user = await authProviderUserManager.getUser();
            if (user) {
              //If yes we try a silent signin
              user = await authProviderUserManager.signinSilent();
              this.getJWTFromOidcToken(user);
            } else {
              //If no we try a redirect signin
              authProviderUserManager.signinRedirect();
            }
          } catch (e) {
            //In any case if it doesn't work we do a redirect signin
            authProviderUserManager?.signinRedirect();
          }
        }
      })();
    }
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
    if (!response.access_token) {
      AlertManager.confirm(
        () => {
          this.signOut();
        },
        () => {
          this.signOut();
        },
        {
          title: languages.t('scenes.login.authprovider.error.title'),
          text: (response as any).error || languages.t('scenes.login.authprovider.error.text'),
        },
      );
      return;
    }
    JWTStorage.updateJWT(response.access_token);
    LoginService.updateUser(() => {});
  }
}

const authProviderService = new AuthProviderService();
export default authProviderService;

function getDomain(str: string): string {
  return ((str || '').split('//').pop() || '').split('/').shift() || '';
}
