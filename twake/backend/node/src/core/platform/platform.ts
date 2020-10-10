import "reflect-metadata";

import { TwakePlatform, TwakeServiceProvider, logger, TwakeServiceState } from "./framework";
import * as ComponentUtils from "./framework/utils/component-utils";

export class Platform extends TwakePlatform {

  api(): TwakeServiceProvider {
    return null;
  }

  async doInit(): Promise<this> {
    logger.info("Init %s", this.name);
    logger.info("Init services %o", this.options.services);

    this.components = await ComponentUtils.loadComponents(this.options.servicesPath, this.options.services, {
      getProvider: this.getProvider.bind(this)
    });

    ComponentUtils.buildDependenciesTree(this.components);

    await this.launchInit();

    return this;
  }

  private async launchInit(): Promise<this> {
    logger.info("Initializing Twake...");

    await this.switchToState(TwakeServiceState.Initialized);

    return this;
  }

  async doStart(): Promise<this> {
    logger.info("Starting Twake...");

    await this.switchToState(TwakeServiceState.Started);

    return this;
  }

  private async switchToState(state: TwakeServiceState.Started | TwakeServiceState.Initialized): Promise<void> {
    const subject$ = ComponentUtils.switchComponentsToState(this.components, state);
    await subject$.toPromise();

    return;
  }
}
