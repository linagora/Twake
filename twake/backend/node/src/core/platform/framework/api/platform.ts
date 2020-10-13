import { TwakeAppConfiguration } from "./application-configuration";
import { TwakeComponent } from "./component";
import { TwakeContext } from "./context";
import { TwakeServiceProvider } from "./service-provider";
import { TwakeService } from "./service";

export abstract class TwakePlatform extends TwakeService<TwakeServiceProvider> implements TwakeContext {
  protected components: Map<string, TwakeComponent> = new Map<string, TwakeComponent>();
  name = "Twake";

  constructor(protected options?: TwakeAppConfiguration) {
    super(options);
  }

  getProvider<T extends TwakeServiceProvider>(name: string): T {
    const service = this.components.get(name).getServiceInstance();

    if (!service) {
      throw new Error(`Service "${name}" not found`);
    }

    return service.api() as T;
  }
}
