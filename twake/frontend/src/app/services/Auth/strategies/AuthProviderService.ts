import { TwakeService } from 'app/services/Decorators/TwakeService';
import InitService, { ConsoleConfiguration, InternalConfiguration } from 'app/services/InitService';
import { AuthProvider } from './AuthProvider';
import OIDCAuthProviderService from './oidc/OIDCAuthProviderService';
import InternalAuthProviderService from './internal/InternalAuthProviderService';
import Logger from 'services/Logger';

@TwakeService('AuthProviderService')
class AuthProviderService {
  private provider: AuthProvider | null = null;
  private logger: Logger.Logger;

  constructor() {
    this.logger = Logger.getLogger('AuthProviderService');
  }

  get(): AuthProvider | null {
    if (this.provider) {
      return this.provider;
    }

    const accountType = InitService.server_infos?.configuration?.accounts.type;
    if (!accountType) {
      this.logger.info('No server account configuration');
      return null;
    }
    const config = InitService.server_infos?.configuration?.accounts[accountType];

    if (accountType === 'console') {
      this.provider = new OIDCAuthProviderService(config as ConsoleConfiguration).init();
    } else if (accountType === 'internal') {
      this.provider = new InternalAuthProviderService(config as InternalConfiguration).init();
    } else {
      throw new Error(`${accountType} is not a valid auth account provider`);
    }

    return this.provider;
  }

}

export default new AuthProviderService();
