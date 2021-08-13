import { TwakeService } from 'app/services/Decorators/TwakeService';
import InitService, { ConsoleConfiguration, InternalConfiguration } from 'app/services/InitService';
import { LoginProvider } from './LoginProvider';
import OIDCLoginProviderService from './oidc/OIDCLoginProviderService';
import InternalLoginProviderService from './internal/InternalLoginProviderService';
import Logger from 'services/Logger';

@TwakeService('LoginProviderService')
class LoginProviderService {
  private provider: LoginProvider | null = null;
  private logger: Logger.Logger;

  constructor() {
    this.logger = Logger.getLogger('LoginProviderService');
  }

  get(): LoginProvider | null {
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
      this.provider = new OIDCLoginProviderService(config as ConsoleConfiguration).init();
    } else if (accountType === 'internal') {
      this.provider = new InternalLoginProviderService(config as InternalConfiguration).init();
    } else {
      throw new Error(`${accountType} is not a valid auth account provider`);
    }

    return this.provider;
  }

}

export default new LoginProviderService();
