import { BehaviorSubject } from "rxjs";
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

  async switchToState(
    state: TwakeServiceState.Initialized | TwakeServiceState.Started | TwakeServiceState.Stopped,
    recursionDepth?: number,
  ): Promise<void> {
    if (recursionDepth > 10) {
      logger.error("Maximum recursion depth exceeded (will exit process)");
      process.exit(1);
    }

    const states: BehaviorSubject<TwakeServiceState>[] = this.components.map(
      component => component.instance.state,
    );

    if (states.length) {
      for (const component of this.components) {
        await component.switchToState(state, (recursionDepth || 0) + 1);
      }
      logger.info(`Children of ${this.name} are all in ${state} state`);
      logger.info(this.getStateTree());
    } else {
      logger.info(`${this.name} does not have children`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function _switchServiceToState(service: TwakeService<any>) {
      state === TwakeServiceState.Initialized && (await service.init());
      state === TwakeServiceState.Started && (await service.start());
      state === TwakeServiceState.Stopped && (await service.stop());
    }
    await _switchServiceToState(this.instance);
  }
}
