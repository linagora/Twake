import { TwakeService, TwakeServiceOptions, TwakeServiceProvider, TwakeServiceState, TwakeServiceConfiguration, TwakeContext } from "./api";

class StaticTwakeServiceFactory {

  public async create<T extends TwakeService<TwakeServiceProvider> = TwakeService<TwakeServiceProvider>>(
    module: { new (options?: TwakeServiceOptions<TwakeServiceConfiguration>): T },
    context: TwakeContext,
    options?: TwakeServiceOptions<TwakeServiceConfiguration>
  ): Promise<T> {
    const instance = new module(options);
    instance.state = TwakeServiceState.Ready;
    instance.context = context;

    return instance;
  }
}

export const TwakeServiceFactory = new StaticTwakeServiceFactory();
