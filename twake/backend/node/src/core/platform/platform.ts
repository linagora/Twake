import { Loader, TwakePlatform, TwakeServiceProvider, TwakeServiceFactory, logger } from "./framework";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Class = { new(...args: any[]): any; };

interface ServiceDefinition {
  name: string;
  clazz: Class;
}

export class Platform extends TwakePlatform {
  api(): TwakeServiceProvider {
    return null;
  }

  async doInit(): Promise<this> {
    logger.info("Init %s", this.name);
    logger.info("Init services %o", this.options.services);

    const context = {
      getProvider: this.getProvider.bind(this)
    };

    // TODO: Create a loader which looks in several configured paths.
    const loader = new Loader("../../../services");

    const serviceDefinitions: ServiceDefinition[] = await Promise.all(this.options.services.map(async name => {
      const clazz = await loader.load(name);

      return { clazz, name };
    }));

    await Promise.all(serviceDefinitions.map(async serviceDefinition => {
      const instance = await TwakeServiceFactory.create(serviceDefinition.clazz, context, serviceDefinition.name);

      this.serviceRegistry.register(instance);
    }));

    await this.launchInit();

    return this;
  }

  private async launchInit(): Promise<this> {
    const promisesToWaitFor: Map<string, Promise<string>[]> = new Map<string, Promise<string>[]>();
    const allInitialized: Promise<string>[] = [...this.serviceRegistry.list()].map(service => service.initPromise);

    logger.info("Initializing Twake...");

    for(const [name, service] of this.serviceRegistry.getMap()) {
      const consumes = service.getConsumes();
      logger.info("service '%s' service is consuming service '%s'", name, consumes);

      const promisesForService = consumes.map(serviceName => {
        // TODO: Check for empty
        // TODO: Check for loops
        logger.info("service '%s' will wait for service '%s' to be initialized", name, serviceName);
        return this.serviceRegistry.get(serviceName).initPromise;
      });

      promisesToWaitFor.set(name, promisesForService);
    }

    for(const [name, service] of this.serviceRegistry.getMap()) {
      Promise.all(promisesToWaitFor.get(name)).then(started => {
        logger.info("services %o are now initialized, now asking for service '%s' to init", started, name);
        service.init().then(() => {
          logger.info("service '%s' is initialized", name);
        });
      })
      .catch(err => {
        logger.error("Init error for service '%s'", name);
        logger.error(err);
        // TODO throw err
      });
    }

    logger.info("Waiting for all services to be initialized...");
    await Promise.all(allInitialized);
    logger.info("All services are now initialized");

    return this;
  }

  async doStart(): Promise<this> {
    await this.launchStart();

    return this;
  }

  private async launchStart(): Promise<this> {
    const promisesToWaitFor: Map<string, Promise<string>[]> = new Map<string, Promise<string>[]>();
    const allStarted: Promise<string>[] = [...this.serviceRegistry.list()].map(service => service.startupPromise);

    logger.info("Starting Twake...");

    for(const [name, service] of this.serviceRegistry.getMap()) {
      const consumes = service.getConsumes();
      logger.info("service '%s' is consuming service '%s'", name, consumes);

      const promisesForService = consumes.map(serviceName => {
        logger.info("service '%s' will wait for service '%s'", name, serviceName);
        return this.serviceRegistry.get(serviceName).startupPromise;
      });

      promisesToWaitFor.set(name, promisesForService);
    }


    for(const [name, service] of this.serviceRegistry.getMap()) {
      Promise.all(promisesToWaitFor.get(name)).then(started => {
        logger.info("services %o are started, now asking for service '%s' to start...", started, name);
        service.start();
      })
      .catch(err => {
        logger.error("Start error for service %s", name);
        logger.error(err);
      });
    }

    logger.info("Waiting for all services to be started...");
    await Promise.all(allStarted);
    logger.info("All services are now started");

    return this;
  }
}
