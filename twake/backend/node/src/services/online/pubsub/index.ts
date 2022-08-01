import { getLogger, Initializable, TwakeLogger } from "../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { UsersOnlineMessage } from "../api";
import { ONLINE_TOPIC } from "../constants";
import { UserOnlineProcessor } from "./processor";
import gr from "../../global-resolver";

export class OnlinePubsubService implements Initializable {
  private logger: TwakeLogger;
  constructor() {
    this.logger = getLogger("online.pubsub.OnlinePubsubService");
  }

  async init(): Promise<this> {
    gr.platformServices.pubsub.processor.addHandler(new UserOnlineProcessor());
    return this;
  }

  async broadcastOnline(online: UsersOnlineMessage = []): Promise<void> {
    if (!online.length) {
      return;
    }

    this.logger.debug(`Publishing online users ${online.map(u => u.user_id).join(",")}`);

    return gr.platformServices.pubsub.publish<UsersOnlineMessage>(ONLINE_TOPIC, {
      data: online,
    });
  }
}
