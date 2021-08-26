import { TwakeAppConfiguration } from "./application-configuration";
import { TwakeComponent } from "./component";
import { TwakeContext } from "./context";
import { TwakeServiceProvider } from "./service-provider";
import { TwakeService } from "./service";
import { TwakeServiceState } from "./service-state";
import * as ComponentUtils from "../utils/component-utils";

/**
 * A container contains components. It provides methods to manage and to retrieve them.
 */
export abstract class TwakeContainer
  extends TwakeService<TwakeServiceProvider>
  implements TwakeContext
{
  private components: Map<string, TwakeComponent>;
  name = "TwakeContainer";

  constructor(protected options?: TwakeAppConfiguration) {
    super(options);
  }

  abstract loadComponents(): Promise<Map<string, TwakeComponent>>;

  getProvider<T extends TwakeServiceProvider>(name: string): T {
    const service = this.components.get(name)?.getServiceInstance();

    if (!service) {
      throw new Error(`Service "${name}" not found`);
    }

    return service.api() as T;
  }

  async doInit(): Promise<this> {
    this.components = await this.loadComponents();
    ComponentUtils.buildDependenciesTree(this.components);

    await this.launchInit();

    return this;
  }

  protected async launchInit(): Promise<this> {
    await this.switchToState(TwakeServiceState.Initialized);

    return this;
  }

  async doStart(): Promise<this> {
    await this.switchToState(TwakeServiceState.Started);

    return this;
  }

  async doStop(): Promise<this> {
    await this.switchToState(TwakeServiceState.Stopped);

    return this;
  }

  protected async switchToState(
    state: TwakeServiceState.Started | TwakeServiceState.Initialized | TwakeServiceState.Stopped,
  ): Promise<void> {
    await ComponentUtils.switchComponentsToState(this.components, state);
  }
}
