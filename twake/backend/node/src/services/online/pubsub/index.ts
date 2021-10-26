import { getLogger, Initializable, TwakeLogger } from "../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { UsersOnlineMessage } from "../api";
import { ONLINE_TOPIC } from "../constants";
import { UserOnlineProcessor } from "./processor";

export class OnlinePubsubService implements Initializable {
  private logger: TwakeLogger;
  constructor(private pubsub: PubsubServiceAPI) {
    this.logger = getLogger("online.pubsub.OnlinePubsubService");
  }

  async init(): Promise<this> {
    this.pubsub.processor.addHandler(new UserOnlineProcessor());
    return this;
  }

  async broadcastOnline(online: UsersOnlineMessage = []): Promise<void> {
    if (!online.length) {
      return;
    }

    this.logger.debug(`Publishing online users ${online.map(u => u[0]).join(",")}`);

    return this.pubsub.publish<UsersOnlineMessage>(ONLINE_TOPIC, {
      data: online,
    });
  }
}
