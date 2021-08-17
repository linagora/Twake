import { TwakeService } from 'app/services/Decorators/TwakeService';
import InitService, { ConsoleConfiguration, InternalConfiguration } from 'app/services/InitService';
import { AuthProvider } from './provider/AuthProvider';
import OIDCAuthProviderService from './provider/oidc/OIDCAuthProviderService';
import InternalAuthProviderService from './provider/internal/InternalAuthProviderService';
import Logger from 'services/Logger';

type AccountType = 'console' | 'internal';

@TwakeService('AuthService')
class AuthService {
  private provider: AuthProvider<any, any> | null = null;
  private logger: Logger.Logger;

  constructor() {
    this.logger = Logger.getLogger('AuthService');
  }

  getProvider(): AuthProvider<any, any> {
    if (this.provider) {
      return this.provider;
    }

    const accountType = this.getAccountType();
    if (!accountType) {
      this.logger.info('No server account configuration');
      this.provider = this.getDefaultProvider();

      return this.provider;
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

  private getDefaultProvider() {
    return new InternalAuthProviderService().init();
  }

  getAccountType(): AccountType | undefined {
    return InitService.server_infos?.configuration?.accounts.type;
  }
}

export default new AuthService();
