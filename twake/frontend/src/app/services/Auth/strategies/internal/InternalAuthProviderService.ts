
import Logger from 'app/services/Logger';
import { InternalConfiguration } from '../../../InitService';
import Observable from '../../../Observable/Observable';
import { TwakeService } from '../../../Decorators/TwakeService';
import { AuthProvider } from '../AuthProvider';

@TwakeService("InternalAuthProvider")
export default class InternalAuthProviderService extends Observable implements AuthProvider {
  private logger: Logger.Logger;
  private initialized: boolean = false;

  constructor(private configuration?: InternalConfiguration) {
    super();
    this.logger = Logger.getLogger("InternalAuthProvider");
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
