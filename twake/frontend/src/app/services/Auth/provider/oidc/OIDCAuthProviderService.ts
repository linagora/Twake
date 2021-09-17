import Oidc from 'oidc-client';

import environment from '../../../../environment/environment';
import { ConsoleConfiguration } from '../../../InitService';
import Observable from '../../../Observable/Observable';
import Logger from 'app/services/Logger';
import { getAsFrontUrl } from '../../../utils/URLUtils';
import { TwakeService } from '../../../Decorators/TwakeService';
import EnvironmentService from '../../../EnvironmentService';
import { AuthProvider, InitParameters } from '../AuthProvider';
import ConsoleService from 'app/services/Console/ConsoleService';
import { JWTDataType } from 'app/services/JWTService';

const OIDC_CALLBACK_URL = '/oidccallback';
const OIDC_SIGNOUT_URL = '/signout';
const OIDC_SILENT_URL = '/oidcsilientrenew';
const OIDC_CLIENT_ID = 'twake';

@TwakeService("OIDCAuthProvider")
export default class OIDCAuthProviderService extends Observable implements AuthProvider<unknown, unknown> {
  private logger: Logger.Logger;
  private userManager: Oidc.UserManager | null = null;
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

    if (!this.userManager) {
      Oidc.Log.logger = Logger.getLogger("OIDCClient");
      Oidc.Log.level = EnvironmentService.isProduction() ? Oidc.Log.WARN : Oidc.Log.DEBUG;

      this.userManager = new Oidc.UserManager({
        userStore: new Oidc.WebStorageStateStore({ store: window.localStorage }),
        authority: this.configuration?.authority || environment.api_root_url,
        client_id: this.configuration?.client_id || OIDC_CLIENT_ID,
        redirect_uri: getAsFrontUrl(OIDC_CALLBACK_URL),
        response_type: 'code',
        scope: 'openid profile email address phone offline_access',
        post_logout_redirect_uri: getAsFrontUrl(OIDC_SIGNOUT_URL),
        //silent_redirect_uri: getAsFrontUrl(OIDC_SILENT_URL),
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

      this.userManager.events.addUserLoaded(user => {
        // fires each time the user is updated
        this.logger.debug('OIDC user loaded listener', user);
        this.getJWTFromOidcToken(user, (err, jwt) => {
          if (err) {
            this.logger.error('OIDC user loaded listener, error while getting the JWT from OIDC token');
            params.onSessionExpired && params.onSessionExpired();
            return;
          }

          params.onNewToken(jwt);
        });
      });

      this.userManager.events.addAccessTokenExpired(() => {
        this.logger.debug('OIDC access token expired listener');
        this.silentLogin(
          () => {
            this.logger.error('OIDC access token expired listener, error while getting the JWT from OIDC token');
            params.onSessionExpired && params.onSessionExpired();
          },
          (token) => {
            this.logger.error('OIDC access token expired listener, got a new token');
            params.onNewToken(token);
          }
        );
      });

      this.userManager.events.addAccessTokenExpiring(() => {
        this.logger.debug('OIDC access token is expiring');
        this.silentLogin(
          () => {
            this.logger.error('OIDC access token expiring listener, error while doing a silent login');
          },
          (token) => {
            this.logger.error('OIDC access token expiring listener, got a new token');
            params.onNewToken(token);
          }
        );
      });

      this.userManager.events.addSilentRenewError(error => {
        // in case the renew failed, ask for login
        // since we have set automaticSilentRenew to true, this will be called when silentSignin raise error when token is expiring
        this.logger.error('OIDC silent renew error', error);
        this.signOut();
      });

      //This even listener is temporary disabled because of this issue: https://gitlab.ow2.org/lemonldap-ng/lemonldap-ng/-/issues/2358
      this.userManager.events.addUserSignedOut(() => {
        this.logger.info('OIDC Signed out listener');
        //this.signOut();
      });

      //This manage the initial sign-in when loading the app
      if (this.enforceFrontendUrl()) {
        this.silentLogin(
          () => {
            this.logger.error('OIDC Init, silent login error, redirecting to login');
            this.userManager?.signinRedirect();
          },
          (token) => {
            this.logger.error('OIDC Init, silent login got a new token');
            params.onNewToken(token);
          }
        );
      }
    }

    this.initialized = true;
    return this;
  }

  //Redirect to valid frontend url to make sure oidc will work as expected
  private enforceFrontendUrl() {
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

  private async silentLogin(onError: () => void, onNewToken: (token?: JWTDataType) => void): Promise<void> {
    if (!this.userManager) {
      this.logger.debug('silentLogin, no auth provider');
      return;
    }

    //Try to use the in-url sign-in response from oidc if exists
    try {
      this.logger.debug('silentLogin, trying to get user from redirect callback');
      await this.userManager.signinRedirectCallback();
      this.userManager.getUser();
    } catch (e) {
      this.logger.debug('silentLogin, not a signin response, trying to signin now', e);
      //There is no sign-in response, so we can try to silent login and use refresh token
      try {
        //First we try to see if we know this user
        let user = await this.userManager.getUser();
        if (user) {
          this.logger.debug('silentLogin, user is already defined, launching silent signin', user);
          //If yes we try a silent signin
          user = await this.userManager.signinSilent();
          this.logger.debug('silentLogin, user from silent signin', user);
          this.getJWTFromOidcToken(user, (err, jwt) => {
            if (err) {
              this.logger.debug('silentLogin, error while getting new token', err);
              onError();
              return;
            }

            onNewToken(jwt);
          });
        } else {
          //If no we try a redirect signin
          this.logger.debug('silentLogin, user not defined, launching a signin redirect');
          this.userManager.signinRedirect();
        }
      } catch (e) {
        this.logger.debug('silentLogin error, launching a signin redirect', e);
        //In any case if it doesn't work we do a redirect signin
        this.userManager.signinRedirect();
      }
    }
  }

  async signIn(): Promise<void> {
    this.logger.info('Signin');
    await this.silentLogin(
      () => {
        this.logger.error('Silent login error');
      },
      (token) => {
        this.logger.info('Signin got a new token');
      }
    );
  }

  async signOut(): Promise<void> {
    this.logger.info("Signout");

    if (!this.userManager) {
      return;
    }

    try {
      await this.userManager.signoutRedirect();
      //JWT.clear();
      // FIXME: can reload to the OIDC signin window, not to the twake one to do not loose time...
      //window.location.reload();
    } catch (err) {
      this.logger.error('Signout redirect error', err);
    }
  }

  /**
   * Try to get a new JWT token from the OIDC one:
   * Call the backend with the OIDC token, it will use it to get a new token from console
   */
  private getJWTFromOidcToken(
    user: Oidc.User | null,
    callback: (err?: Error, accessToken?: JWTDataType) => void,
  ): void {
    if (!user) {
      this.logger.info('getJWTFromOidcToken, Cannot getJWTFromOidcToken with a null user');
      callback(new Error('Cannot getJWTFromOidcToken with a null user'));
      return;
    }

    if (user.expired) {
      // TODO: try to get a new token from refresh one before asking for a JWT token
      this.logger.info('getJWTFromOidcToken, user expired');
    }

    ConsoleService.getNewAccessToken({ access_token: user.access_token }, callback);
  }
}

function getDomain(str: string): string {
  return ((str || '').split('//').pop() || '').split('/').shift() || '';
}
