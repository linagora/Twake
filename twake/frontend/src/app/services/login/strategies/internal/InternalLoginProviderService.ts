
import { InternalConfiguration } from '../../../InitService';
import Observable from '../../../Observable/Observable';
import Logger from 'app/services/Logger';
import { TwakeService } from '../../../Decorators/TwakeService';
import { LoginProvider } from '../LoginProvider';

@TwakeService("InternalLoginProvider")
export default class InternalLoginProviderService extends Observable implements LoginProvider {
  private logger: Logger.Logger;
  private initialized: boolean = false;

  constructor(private configuration?: InternalConfiguration) {
    super();
    this.logger = Logger.getLogger("InternalLoginProvider");
    this.logger.debug('Internal configuration', configuration);
  }

  init(): this {
    if (this.initialized) {
      this.logger.warn('Already initialized');
      return this;
    }

    // TODO

    this.initialized = true;
    return this;
  }
}
