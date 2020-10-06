import { TwakeServiceFactory } from "./factory";
import classLoader from "./loader";
import { TwakePlatform, TwakeService, TwakeServiceProvider } from "./api";
import Configuration from "./configuration";
import AuthService from "../../services/auth";
import UserService from "../../services/user";
import MessageService from "../../services/messages";
import WebServerService from "../../services/webserver";
import { logger } from "./logger";

export class Platform extends TwakePlatform {
  private services: Map<string, TwakeService<TwakeServiceProvider>> = new Map<string, TwakeService<TwakeServiceProvider>>();

  api(): TwakeServiceProvider {
    return null;
  }

  async doInit(): Promise<this> {
    logger.info("Init %s", this.name);
    // TODO: Load services from options
    // TODO: Dynamic loading
    logger.info("Init services %o", this.options.services);

    const context = {
      getProvider: this.getProvider.bind(this)
    };

    const classes = await Promise.all(this.options.services.map(serviceName => classLoader(`../../services/${serviceName}`)));

    console.log(classes);
//
    //classes.forEach(async clazz => {
    //  const service = await TwakeServiceFactory.create(clazz, context, { prefix: "/api/XYZ", consumes: [], configuration: new Configuration("web")});
    //  this.providers.set(service.name, service.api());
    //  this.services.set(service.name, service);
    //});


    const webserver = await TwakeServiceFactory.create(WebServerService, context, { configuration: new Configuration("web") });
    this.providers.set(webserver.name, webserver.api());

    const auth = await TwakeServiceFactory.create(AuthService, context);
    const user = await TwakeServiceFactory.create(UserService, context);
    const message = await TwakeServiceFactory.create(MessageService, context);

    this.services.set(webserver.name, webserver);
    this.services.set(auth.name, auth);
    this.services.set(user.name, user);
    this.services.set(message.name, message);


    await this.launchInit();

    return this;
  }

  private async launchInit(): Promise<this> {
    const promisesToWaitFor: Map<string, Promise<string>[]> = new Map<string, Promise<string>[]>();
    const allInitialized: Promise<string>[] = [...this.services.values()].map(service => service.initPromise);

    logger.info("Initializing Twake...");

    for(const [name, service] of this.services) {
      const consumes = service.getConsumes();
      logger.info("service '%s' service is consuming service '%s'", name, consumes);

      const promisesForService = consumes.map(serviceName => {
        // TODO: Check for empty
        // TODO: Check for loops
        logger.info("service '%s' will wait for service '%s' to be initialized", name, serviceName);
        return this.services.get(serviceName).initPromise;
      });

      promisesToWaitFor.set(name, promisesForService);
    }

    for(const [name, service] of this.services) {
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
    const allStarted: Promise<string>[] = [...this.services.values()].map(service => service.startupPromise);

    logger.info("Starting Twake...");

    for(const [name, service] of this.services) {
      const consumes = service.getConsumes();
      logger.info("service '%s' is consuming service '%s'", name, consumes);

      const promisesForService = consumes.map(serviceName => {
        logger.info("service '%s' will wait for service '%s'", name, serviceName);
        return this.services.get(serviceName).startupPromise;
      });

      promisesToWaitFor.set(name, promisesForService);
    }


    for(const [name, service] of this.services) {
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
