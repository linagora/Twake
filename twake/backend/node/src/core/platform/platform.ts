import { filter } from "rxjs/operators";
import WebSocketAPI from "../../services/websocket/provider";
import { TwakeContainer, TwakeServiceProvider, TwakeComponent, TwakeServiceState } from "./framework";
import RealtimeManager from "./framework/realtime/manager";
import * as ComponentUtils from "./framework/utils/component-utils";

export class TwakePlatform extends TwakeContainer {
  private realtimeManager: RealtimeManager;

  constructor(protected options: TwakePlatformConfiguration) {
    super();
    this.buildRealtimeManager();
  }

  api(): TwakeServiceProvider {
    return null;
  }

  async loadComponents(): Promise<Map<string, TwakeComponent>> {
    return await ComponentUtils.loadComponents(this.options.servicesPath, this.options.services, {
      getProvider: this.getProvider.bind(this)
    });
  }

  buildRealtimeManager(): void {
    const started$ = this.state.pipe(
      filter((value: TwakeServiceState) => value === TwakeServiceState.Started)
    )
    .subscribe(() => {
      started$.unsubscribe();

      // TODO: The websocket service MUST be a platform service
      const ws: WebSocketAPI = this.getProvider<WebSocketAPI>("websocket");
      if (ws) {
        this.realtimeManager = new RealtimeManager(ws);
      }
    });
  }


}

export class TwakePlatformConfiguration {
  /**
   * The services to load in the container
   */
  services: string[];

  /**
   * The path to load services from
   */
  servicesPath: string;
}
