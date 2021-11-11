import WebSocketAPI from "../../core/platform/services/websocket/provider";
import { getLogger, TwakeLogger } from "../../core/platform/framework/logger";
import { CronAPI } from "../../core/platform/services/cron/api";
import { WebSocket } from "../../core/platform/services/websocket/types";
import { Initializable } from "../../core/platform/framework";
import { JOB_CRON_EXPRESSION } from "./constants";
import { filter } from "lodash";
import { OnlineServiceAPI } from "./api";

export default class OnlineJob implements Initializable {
  private logger: TwakeLogger;
  constructor(
    private cron: CronAPI,
    private websocket: WebSocketAPI,
    private onlineService: OnlineServiceAPI,
  ) {
    this.logger = getLogger("OnlineJob");
  }

  async init(): Promise<this> {
    const task = this.cron.schedule(JOB_CRON_EXPRESSION, async () => {
      this.logger.info("Running online job");

      const connectedWebsockets: WebSocket[] = filter(
        this.websocket.getIo().sockets.sockets,
        "connected",
      ) as unknown as WebSocket[];

      await this.onlineService.setLastSeenOnline(
        connectedWebsockets
          .filter(ws => ws?.decoded_token)
          .map(ws => this.websocket.getUser(ws))
          .map(user => user.id),
        Date.now(),
      );
    });
    this.logger.debug("Status Job has been submitted", task.id);

    return this;
  }
}
