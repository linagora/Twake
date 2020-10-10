import "reflect-metadata";

import { combineLatest, Subject } from "rxjs";
import { filter } from "rxjs/operators";
import { Loader, TwakePlatform, TwakeServiceProvider, TwakeServiceFactory, logger, TwakeServiceState, TwakeComponent } from "./framework";

export class Platform extends TwakePlatform {
  protected components: Map<string, TwakeComponent> = new Map<string, TwakeComponent>();

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
    const loader = new Loader(this.options.servicesPath);

    const components: TwakeComponent[] = await Promise.all(this.options.services.map(async name => {
      const clazz = await loader.load(name);

      const component = new TwakeComponent(name, {clazz, name});
      this.components.set(name, component);

      return component;
    }));

    await Promise.all(components.map(async component => {
      const service = await TwakeServiceFactory.create(component.getServiceDefinition().clazz, context, component.getServiceDefinition().name);

      component.setServiceInstance(service);

      this.serviceRegistry.register(service);
    }));

    // Fill the child components for each component
    for(const [name, component] of this.components) {
      const dependencies: string[] = component.getServiceInstance().getConsumes() || [];

      dependencies.forEach(dependencyName => {
        if (name === dependencyName) {
          throw new Error(`There is a circular dependency for component ${dependencyName}`);
        }
        const dependencyComponent = this.components.get(dependencyName);

        if (!dependencyComponent) {
          throw new Error(`The component dependency ${dependencyName} has not been found for component ${name}`);
        }

        component.addDependency(dependencyComponent);
      });
    }

    await this.launchInit();

    return this;
  }

  private async launchInit(): Promise<this> {
    logger.info("Initializing Twake...");

    const init$ = this.launch(TwakeServiceState.Initialized);
    await init$.toPromise();

    return this;
  }

  async doStart(): Promise<this> {
    logger.info("Starting Twake...");
    const start$ = this.launch(TwakeServiceState.Started);

    await start$.toPromise();

    return this;
  }

  private launch(state: TwakeServiceState.Initialized | TwakeServiceState.Started) {
    const subject = new Subject<boolean>();
    const states = [];

    for(const [name, component] of this.components) {
      logger.info(`Asking for ${state} on ${name} dependencies`);
      states.push(component.getServiceInstance().state);
      component.switchToState(state);
    }

    const subscription = combineLatest(states).pipe(
      filter((value: Array<TwakeServiceState>) => value.every(v => v === state)),
    ).subscribe(() => {
      logger.info(`All components are now in ${state} state`);
      subject.complete();
      subscription.unsubscribe();
    });

    return subject;
  }
}
