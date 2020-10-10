import { combineLatest, BehaviorSubject } from "rxjs";
import { filter } from "rxjs/operators";
import { TwakeServiceConfiguration } from "./configuration";
import { CONSUMES_METADATA, PREFIX_METADATA } from "./constants";
import { logger } from "./logger";
import { Registry } from "./registry";


class TwakeServiceOptions<TwakeServiceConfiguration> {
  name?: string;
  // TODO: configuration is abstract and comes from all others
  configuration?: TwakeServiceConfiguration;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Class = { new(...args: any[]): any; };

interface ServiceDefinition {
  name: string;
  clazz: Class;
}

class TwakeAppConfiguration extends TwakeServiceOptions<TwakeServiceConfiguration> {
  services: Array<string>;
  servicesPath: string;
}

enum TwakeServiceState {
  Ready = "READY",
  Initializing = "INITIALIZING",
  Initialized = "INITIALIZED",
  Starting = "STARTING",
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
  state: BehaviorSubject<TwakeServiceState>;
  readonly name: string;
  protected readonly configuration: TwakeServiceConfiguration;
  context: TwakeContext;

  constructor(protected options?: TwakeServiceOptions<TwakeServiceConfiguration>) {
    this.state = new BehaviorSubject<TwakeServiceState>(TwakeServiceState.Ready);
    this.configuration = options?.configuration;
  }

  abstract api(): TwakeServiceProvider;

  public get prefix() : string {
    return Reflect.getMetadata(PREFIX_METADATA, this) || "/";
  }

  getConsumes(): Array<string> {
    return Reflect.getMetadata(CONSUMES_METADATA, this) || [];
  }

  async init(): Promise<this> {
    if (this.state.value !== TwakeServiceState.Ready) {
      logger.info("Service %s is already initialized", this.name);
      return this;
    }

    try {
      logger.info("Initializing service %s", this.name);
      this.state.next(TwakeServiceState.Initializing);
      await this.doInit();
      this.state.next(TwakeServiceState.Initialized);

      return this;
    } catch (err) {
      logger.error("Error while initializing service %s", this.name);
      logger.error(err);
      this.state.error(new Error(`Error while initializing service ${this.name}`));

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
    if (this.state.value === TwakeServiceState.Starting || this.state.value === TwakeServiceState.Started) {
      logger.info("Service %s is already started", this.name);
      return this;
    }

    try {
      logger.info("Starting service %s", this.name);
      this.state.next(TwakeServiceState.Starting);
      await this.doStart();
      this.state.next(TwakeServiceState.Started);
      logger.info("Service %s is started", this.name);

      return this;
    } catch (err) {
      logger.error("Error while starting service %s", this.name, err);
      logger.error(err);
      this.state.error(new Error(`Error while starting service ${this.name}`));

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

class TwakeComponent {
  instance: TwakeService<TwakeServiceProvider>;
  components: Array<TwakeComponent> = new Array<TwakeComponent>();

  constructor(public name: string, private serviceDefinition: ServiceDefinition) {}

  getServiceDefinition(): ServiceDefinition {
    return this.serviceDefinition;
  }

  setServiceInstance(instance: TwakeService<TwakeServiceProvider>): void {
    this.instance = instance;
  }

  getServiceInstance(): TwakeService<TwakeServiceProvider> {
    return this.instance;
  }

  addDependency(component: TwakeComponent): void {
    this.components.push(component);
  }

  getStateTree(): string {
    return `${this.name}(${this.instance.state.value}) => {${this.components.map(component => component.getStateTree()).join(",")}}`;
  }

  switchToState(state: TwakeServiceState.Initialized | TwakeServiceState.Started): void {
    const states: BehaviorSubject<TwakeServiceState>[] = this.components.map(component => component.instance.state);

    this.components.forEach(component => {
      state === TwakeServiceState.Initialized && component.instance.init();
      state === TwakeServiceState.Started && component.instance.start();
    });

    const subscription = combineLatest(states).pipe(
      filter((value: Array<TwakeServiceState>) => value.every(v => v === state)),
    ).subscribe(() => {
      logger.info(`Children of ${this.name} are all in ${state} state`);
      logger.info(this.getStateTree());
      state === TwakeServiceState.Initialized && this.instance.init();
      state === TwakeServiceState.Started && this.instance.start();

      subscription.unsubscribe();
    });
  }
}

export {
  TwakeComponent,
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
