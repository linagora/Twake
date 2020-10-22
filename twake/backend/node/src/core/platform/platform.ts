import { filter } from "rxjs/operators";
import WebSocketAPI from "../../services/websocket/provider";
import { TwakeContainer, TwakeServiceProvider, TwakeComponent, TwakeServiceState } from "./framework";
import { RealtimeService } from "./framework/realtime";
import * as ComponentUtils from "./framework/utils/component-utils";

export class TwakePlatform extends TwakeContainer {
  // TODO: As a technical service, this one must be started by the platform
  private realtimeService: RealtimeService;

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
      // TODO: This block will be removed as soon as technical platform services are up and running
      const ws: WebSocketAPI = this.getProvider<WebSocketAPI>("websocket");

      if (ws) {
        this.realtimeService = new RealtimeService();
        this.realtimeService.bind(ws);
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
