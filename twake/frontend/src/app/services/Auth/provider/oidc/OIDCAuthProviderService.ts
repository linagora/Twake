import Oidc from 'oidc-client';

import environment from '../../../../environment/environment';
import Api from '../../../Api';
import { ConsoleConfiguration } from '../../../InitService';
import JWT, { JWTDataType } from '../../../JWTService';
import Observable from '../../../Observable/Observable';
import LoginService from '../../../login/LoginService';
import Logger from 'app/services/Logger';
import { getAsFrontUrl } from '../../../utils/URLUtils';
import { TwakeService } from '../../../Decorators/TwakeService';
import EnvironmentService from '../../../EnvironmentService';
import { AuthProvider, InitParameters } from '../AuthProvider';

const OIDC_CALLBACK_URL = '/oidccallback';
const OIDC_SIGNOUT_URL = '/signout';
const OIDC_SILENT_URL = '/oidcsilientrenew';
const OIDC_CLIENT_ID = 'twake';

@TwakeService("OIDCAuthProvider")
export default class OIDCAuthProviderService extends Observable implements AuthProvider<unknown, unknown> {
  private logger: Logger.Logger;
  private authProviderUserManager: Oidc.UserManager | null = null;
  private initialized: boolean = false;

  constructor(private configuration?: ConsoleConfiguration) {
    super();
    this.logger = Logger.getLogger("OIDCLoginProvider");
    this.logger.debug('OIDC configuration', configuration);
  }

  init(params: InitParameters): this {
    if (this.initialized) {
      this.logger.warn('Alreay initialized');
      return this;
    }

    if (!this.authProviderUserManager) {
      Oidc.Log.logger = Logger;
      Oidc.Log.level = EnvironmentService.isProduction() ? Oidc.Log.WARN : Oidc.Log.DEBUG;

      this.authProviderUserManager = new Oidc.UserManager({
        userStore: new Oidc.WebStorageStateStore({ store: window.localStorage }),
        authority: this.configuration?.authority || environment.api_root_url,
        client_id: this.configuration?.client_id || OIDC_CLIENT_ID,
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
        // fires each time the user is updated
        this.logger.debug('OIDC user loaded listener', user);
        this.getJWTFromOidcToken(user, () => {
          this.logger.error('OIDC user loaded listener, error while getting the JWT from OIDC token');
          params.onSessionExpired && params.onSessionExpired();
        });
      });

      this.authProviderUserManager.events.addAccessTokenExpired(() => {
        this.logger.debug('OIDC access token expired listener');
        this.silentLogin(() => {
          this.logger.error('OIDC access token expired listener, error while getting the JWT from OIDC token');
          params.onSessionExpired && params.onSessionExpired();
        });
      });

      this.authProviderUserManager.events.addAccessTokenExpiring(() => {
        this.logger.debug('OIDC access token is expiring');
      });

      //This even listener is temporary disabled because of this issue: https://gitlab.ow2.org/lemonldap-ng/lemonldap-ng/-/issues/2358
      this.authProviderUserManager.events.addUserSignedOut(() => {
        this.logger.info('Signed out listener');
        //this.signOut();
      });

      //This manage the initial sign-in when loading the app
      if (this.enforceFrontendUrl()) {
        this.silentLogin(() => {
          this.logger.error('OIDC Init error');
          params.onSessionExpired && params.onSessionExpired();
        });
      }
    }

    this.initialized = true;
    return this;
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

  private async silentLogin(onError: () => void): Promise<void> {
    if (!this.authProviderUserManager) {
      this.logger.debug('silentLogin, no auth provider');
      return;
    }

    //Try to use the in-url sign-in response from oidc if exists
    try {
      this.logger.debug('silentLogin, trying to get user from redirect callback');
      await this.authProviderUserManager.signinRedirectCallback();
      this.authProviderUserManager.getUser();
    } catch (e) {
      this.logger.debug('silentLogin, not a signin response, trying to signin now', e);
      //There is no sign-in response, so we can try to silent login and use refresh token
      try {
        //First we try to see if we know this user
        let user = await this.authProviderUserManager.getUser();
        if (user) {
          this.logger.debug('silentLogin, user is already defined, launching silent signin');
          //If yes we try a silent signin
          user = await this.authProviderUserManager.signinSilent();
          this.getJWTFromOidcToken(user, onError);
        } else {
          //If no we try a redirect signin
          this.logger.debug('silentLogin, user not defined, launching a signin redirect');
          this.authProviderUserManager.signinRedirect();
        }
      } catch (e) {
        this.logger.debug('silentLogin error, launching a signin redirect', e);
        //In any case if it doesn't work we do a redirect signin
        this.authProviderUserManager.signinRedirect();
      }
    }
  }

  async signIn(): Promise<void> {
    this.logger.info('Signin');
  }

  async signOut(): Promise<void> {
    this.logger.info("Signout");

    if (!this.authProviderUserManager) {
      return;
    }

    try {
      await this.authProviderUserManager.signoutRedirect();
      // FXIME : This may not be called...
      // This must be in the genereic login service
      JWT.clear();
      window.location.reload();
    } catch (err) {
      this.logger.error(err);
    }

  }

  private async getJWTFromOidcToken(user: Oidc.User | null, onError: () => void): Promise<void> {
    if (!user) {
      this.logger.info('Cannot getJWTFromOidcToken with a null user');
      return;
    }
    const response = (await Api.post('users/console/token', {
      // FIXME: The access token is potentially expired, we MUST use the refresh one in this case!
      // TODO: Add logic for this like we do in the JWT service
      access_token: user.access_token,
    })) as { access_token: JWTDataType };

    if (!response.access_token) {
      this.logger.error('Can not retrieve access_token from console. Response was', response);
      onError();
      return;
    }

    JWT.update(response.access_token);
    // FIXME: having the login service linked here is also bad
    LoginService.updateUser();
  }
}

function getDomain(str: string): string {
  return ((str || '').split('//').pop() || '').split('/').shift() || '';
}
