import { TwakeServiceConfiguration } from "./configuration";
import { CONSUMES_METADATA, PREFIX_METADATA } from "./constants";
import { logger } from "./logger";
import { Registry } from "./registry";



class TwakeServiceOptions<TwakeServiceConfiguration> {
  name?: string;
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

  public get prefix() : string {
    return Reflect.getMetadata(PREFIX_METADATA, this) || "/";
  }

  getConsumes(): Array<string> {
    return Reflect.getMetadata(CONSUMES_METADATA, this) || [];
  }

  async init(): Promise<this> {
    try {
      logger.info("Initializing service %s", this.name);
      await this.doInit();
      this.state = TwakeServiceState.Initialized;
      this.isInitialized(this.name);

      return this;
    } catch (err) {
      logger.error("Error while initializing service %s", this.name);
      logger.error(err);
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
      logger.info("Starting service %s", this.name);
      await this.doStart();
      this.state = TwakeServiceState.Started;
      this.isStarted(this.name);
      logger.info("Service %s is started", this.name);

      return this;
    } catch (err) {
      logger.error("Error while starting service %s", this.name, err);
      logger.error(err);
      this.state = TwakeServiceState.Errored;
      this.isStartFailure(err);

      throw err;
    }
  }
}

abstract class TwakePlatform extends TwakeService<TwakeServiceProvider> implements TwakeContext {
  protected serviceRegistry: Registry;
  name = "Twake";

  constructor(protected options?: TwakeAppConfiguration) {
    super(options);
    this.serviceRegistry = Registry.getInstance();
  }

  getProvider<T extends TwakeServiceProvider>(name: string): T {
    const service = this.serviceRegistry.get(name);

    if (!service) {
      throw new Error(`Service "${name}" not found`);
    }

    return service.api() as T;
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
