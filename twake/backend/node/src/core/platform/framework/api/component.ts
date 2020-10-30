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

    this.components.forEach(component => {
      state === TwakeServiceState.Initialized && component.instance.init();
      state === TwakeServiceState.Started && component.instance.start();
      state === TwakeServiceState.Stopped && component.instance.stop();
    });

    const subscription = combineLatest(states)
      .pipe(filter((value: Array<TwakeServiceState>) => value.every(v => v === state)))
      .subscribe(() => {
        logger.info(`Children of ${this.name} are all in ${state} state`);
        logger.info(this.getStateTree());
        state === TwakeServiceState.Initialized && this.instance.init();
        state === TwakeServiceState.Started && this.instance.start();
        state === TwakeServiceState.Stopped && this.instance.stop();

        subscription.unsubscribe();
      });
  }
}
