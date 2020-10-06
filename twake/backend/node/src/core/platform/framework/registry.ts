import { TwakeService, TwakeServiceProvider } from "./api";

export class Registry {
  protected providers: Map<string, TwakeService<TwakeServiceProvider>>;

  constructor() {
    this.providers = new Map<string, TwakeService<TwakeServiceProvider>>();
  }

  register(provider: TwakeService<TwakeServiceProvider>): Registry {
    this.providers.set(provider.name, provider);

    return this;
  }

  get(name: string): TwakeService<TwakeServiceProvider> {
    return this.providers.get(name);
  }

  list(): IterableIterator<TwakeService<TwakeServiceProvider>> {
    return this.providers.values();
  }

  getMap(): Map<string, TwakeService<TwakeServiceProvider>> {
    return this.providers;
  }
}
