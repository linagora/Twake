import Oidc from 'oidc-client';
import { AuthProviderProps } from 'oidc-react';

import environment from '../../environment/environment';
import Api from '../Api';
import InitService from '../InitService';
import JWT, { JWTDataType } from '../JWTService';
import Observable from '../Observable/Observable';
import LoginService from './login';
import Logger from 'app/services/Logger';
import { getAsFrontUrl } from '../utils/URLUtils';
import AlertManager from 'services/AlertManager/AlertManager';
import { TwakeService } from '../Decorators/TwakeService';
import EnvironmentService from '../EnvironmentService';

type AuthProviderConfiguration = AuthProviderProps;

const OIDC_CALLBACK_URL = '/oidccallback';
const OIDC_SIGNOUT_URL = '/signout';
const OIDC_SILENT_URL = '/oidcsilientrenew';
const OIDC_CLIENT_ID = 'twake';

@TwakeService("OIDCAuthProvider")
class AuthProviderService extends Observable {
  private authProviderUserManager: Oidc.UserManager | null = null;
  private logger: Logger.Logger;

  constructor() {
    super();
    this.logger = Logger.getLogger("OIDCAuthProvider");
  }

  getAuthProviderConfiguration(): AuthProviderConfiguration {
    const consoleConfiguration = InitService.server_infos?.configuration?.accounts.console;

    if (!this.authProviderUserManager) {
      Oidc.Log.logger = Logger;
      Oidc.Log.level = EnvironmentService.isProduction() ? Oidc.Log.WARN : Oidc.Log.DEBUG;

      this.authProviderUserManager = new Oidc.UserManager({
        userStore: new Oidc.WebStorageStateStore({ store: window.localStorage }),
        authority: consoleConfiguration?.authority || environment.api_root_url,
        client_id: consoleConfiguration?.client_id || OIDC_CLIENT_ID,
        redirect_uri: getAsFrontUrl(OIDC_CALLBACK_URL),
        response_type: 'code',
        scope: 'openid profile email address phone offline_access',
        post_logout_redirect_uri: getAsFrontUrl(OIDC_SIGNOUT_URL),
        silent_redirect_uri: getAsFrontUrl(OIDC_SILENT_URL),
        automaticSilentRenew: true,
        loadUserInfo: true,
        accessTokenExpiringNotificationTime: 60,
        filterProtocolClaims: true,
      });

      // For logout if signout or logout endpoint called
      if ([OIDC_SIGNOUT_URL, '/logout'].includes(document.location.pathname)) {
        this.logger.debug('Redirect signout');
        this.signOut();
      }

      this.authProviderUserManager.events.addUserLoaded(async user => {
        this.logger.debug('OIDC user loaded listener', user);
        this.getJWTFromOidcToken(user);
      });

      this.authProviderUserManager.events.addAccessTokenExpired(() => {
        this.logger.debug('OIDC access token expired listener');
        this.silentLogin();
      });

      //This even listener is temporary disabled because of this issue: https://gitlab.ow2.org/lemonldap-ng/lemonldap-ng/-/issues/2358
      this.authProviderUserManager.events.addUserSignedOut(() => {
        this.logger.info('Signed out listener');
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

  async signOut(): Promise<void> {
    this.logger.info("Signout");

    this.authProviderUserManager && this.authProviderUserManager.signoutRedirect()
      .then(() => {
        JWT.clear();
        window.location.reload();
      })
      .catch(err => this.logger.error(err));
  }

  async getJWTFromOidcToken(user: Oidc.User | null): Promise<void> {
    if (!user) {
      this.logger.info('Cannot getJWTFromOidcToken with a null user');
      return;
    }
    const response = (await Api.post('users/console/token', {
      access_token: user.access_token,
    })) as { access_token: JWTDataType };

    if (!response.access_token) {
      AlertManager.confirm(
        () => this.signOut(),
        () => this.signOut(),
        {
          title: 'We are unable to open your account.',
          text: (response as any).error,
        },
      );
      return;
    }

    JWT.update(response.access_token);
    LoginService.updateUser();
  }
}

export default new AuthProviderService();

function getDomain(str: string): string {
  return ((str || '').split('//').pop() || '').split('/').shift() || '';
}
