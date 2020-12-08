import { combineLatest, BehaviorSubject } from "rxjs";
import { filter } from "rxjs/operators";
import { TwakeService } from "./service";
import { TwakeServiceProvider } from "./service-provider";
import { ServiceDefinition } from "./service-definition";
import { TwakeServiceState } from "./service-state";
import { logger } from "../logger";

export class TwakeComponent {
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
    return `${this.name}(${this.instance.state.value}) => {${this.components
      .map(component => component.getStateTree())
      .join(",")}}`;
  }

  switchToState(
    state: TwakeServiceState.Initialized | TwakeServiceState.Started | TwakeServiceState.Stopped,
  ): void {
    const states: BehaviorSubject<TwakeServiceState>[] = this.components.map(
      component => component.instance.state,
    );

    if (!states.length) {
      logger.info(`${this.name} does not have children`);
      _switchServiceToState(this.instance);

      return;
    }

    this.components.forEach(component => _switchServiceToState(component.instance));

    const subscription = combineLatest(states)
      .pipe(filter((value: Array<TwakeServiceState>) => value.every(v => v === state)))
      .subscribe(() => {
        logger.info(`Children of ${this.name} are all in ${state} state`);
        logger.info(this.getStateTree());

        _switchServiceToState(this.instance);
        subscription.unsubscribe();
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function _switchServiceToState(service: TwakeService<any>) {
      state === TwakeServiceState.Initialized && service.init();
      state === TwakeServiceState.Started && service.start();
      state === TwakeServiceState.Stopped && service.stop();
    }
  }
}
