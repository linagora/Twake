import log from "./logger";

interface TwakeServiceConfiguration {
  get<T>(name: string): T;
}

class TwakeServiceOptions<TwakeServiceConfiguration> {
  name?: string;
  prefix: string;
  consumes?: Array<string>;
  // TODO: configuration is abstract and comes from all others
  configuration?: TwakeServiceConfiguration;
}

class TwakeAppConfiguration extends TwakeServiceOptions<TwakeServiceConfiguration> {
  services: Array<string>;
}

enum TwakeServiceState {
  Ready = "READY",
  Initialized = "INITIALIZED",
  Started = "STARTED",
  Errored = "ERRORED"
}

interface TwakeServiceInterface<TwakeServiceProvider> {
  doInit(): Promise<this>;
  doStart(): Promise<this>;
  api(): TwakeServiceProvider
}

interface TwakeServiceProvider {
  version: string;
}

interface TwakeContext {
  getProvider<T extends TwakeServiceProvider>(name: string): T;
}

abstract class TwakeService<TwakeServiceProvider> implements TwakeServiceInterface<TwakeServiceProvider> {
  readonly initPromise: Promise<string>;
  isInitialized: (value: string | PromiseLike<string>) => void;
  isInitFailure: (reason?: Error) => void;
  readonly startupPromise: Promise<string>;
  isStarted: (value: string | PromiseLike<string>) => void;
  isStartFailure: (reason?: Error) => void;
  readonly name: string;
  protected readonly configuration: TwakeServiceConfiguration;
  state: TwakeServiceState;
  context: TwakeContext;

  constructor(protected options?: TwakeServiceOptions<TwakeServiceConfiguration>) {
    this.configuration = options?.configuration;
    this.startupPromise = new Promise((resolve, reject) => {
      this.isStarted = resolve;
      this.isStartFailure = reject;
    });
    this.initPromise = new Promise((resolve, reject) => {
      this.isInitialized = resolve;
      this.isInitFailure = reject;
    });
  }

  abstract api(): TwakeServiceProvider;

  // TODO: Should be initialized from decorator or class property
  getConsumes(): Array<string> {
    return this.options.consumes || [];
  }

  async init(): Promise<this> {
    try {
      log.info("Initializing service %s", this.name);
      await this.doInit();
      this.state = TwakeServiceState.Initialized;
      this.isInitialized(this.name);

      return this;
    } catch (err) {
      log.error("Error while initializing service %s", this.name);
      log.error(err);
      this.state = TwakeServiceState.Errored;
      this.isInitFailure(err);

      throw err;
    }
  }

  async doInit(): Promise<this> {
    return this;
  }

  async doStart(): Promise<this> {
    return this;
  }

  async start(): Promise<this> {
    try {
      log.info("Starting service %s", this.name);
      await this.doStart();
      this.state = TwakeServiceState.Started;
      this.isStarted(this.name);
      log.info("Service %s is started", this.name);

      return this;
    } catch (err) {
      log.error("Error while starting service %s", this.name, err);
      log.error(err);
      this.state = TwakeServiceState.Errored;
      this.isStartFailure(err);

      throw err;
    }
  }
}

abstract class TwakePlatform extends TwakeService<TwakeServiceProvider> implements TwakeContext {
  name = "Twake";
  protected providers: Map<string, TwakeServiceProvider> = new Map<string, TwakeServiceProvider>();

  constructor(protected options?: TwakeAppConfiguration) {
    super(options);
  }

  getProvider<T extends TwakeServiceProvider>(name: string): T {
    return this.providers.get(name) as T;
  }
}

export {
  TwakePlatform,
  TwakeService,
  TwakeServiceInterface,
  TwakeAppConfiguration,
  TwakeServiceOptions,
  TwakeServiceState,
  TwakeServiceProvider,
  TwakeServiceConfiguration,
  TwakeContext
};
