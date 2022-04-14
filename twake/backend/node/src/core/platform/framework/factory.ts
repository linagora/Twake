import {
  TwakeContext,
  TwakeService,
  TwakeServiceConfiguration,
  TwakeServiceOptions,
  TwakeServiceProvider,
} from "./api";
import { Configuration } from "./configuration";

class StaticTwakeServiceFactory {
  public async create<
    T extends TwakeService<TwakeServiceProvider> = TwakeService<TwakeServiceProvider>,
  >(
    module: { new (options?: TwakeServiceOptions<TwakeServiceConfiguration>): T },
    context: TwakeContext,
    configuration?: string,
  ): Promise<T> {
    let config;

    if (configuration) {
      config = new Configuration(configuration);
    }

    const instance = new module({ configuration: config });

    instance.context = context;

    return instance;
  }
}

export const TwakeServiceFactory = new StaticTwakeServiceFactory();
