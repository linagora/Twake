import { getLogger, TwakeLogger } from "../../core/platform/framework";
import { WebSocket } from "../../core/platform/services/websocket/types";
import { Initializable } from "../../core/platform/framework";
import { JOB_CRON_EXPRESSION } from "./constants";
import { filter } from "lodash";
import gr from "../global-resolver";

export default class OnlineJob implements Initializable {
  private logger: TwakeLogger;
  constructor() {
    this.logger = getLogger("OnlineJob");
  }

  async init(): Promise<this> {
    const task = gr.platformServices.cron.schedule(JOB_CRON_EXPRESSION, async () => {
      this.logger.info("Running online job");

      const connectedWebsockets: WebSocket[] = filter(
        gr.platformServices.websocket.getIo().sockets.sockets,
        "connected",
      ) as unknown as WebSocket[];

      await gr.services.online.setLastSeenOnline(
        connectedWebsockets
          .filter(ws => ws?.decoded_token)
          .map(ws => gr.platformServices.websocket.getUser(ws))
          .map(user => user.id),
        Date.now(),
      );
    });
    this.logger.debug("Status Job has been submitted", task.id);

    return this;
  }
}
