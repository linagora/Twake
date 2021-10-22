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

  async broadcastOnline(userIds: Array<string> = []): Promise<void> {
    this.logger.debug(`Publishing online users ${userIds.join(",")}`);
    if (!userIds || !userIds.length) {
      return;
    }

    return this.pubsub.publish<UsersOnlineMessage>(ONLINE_TOPIC, {
      data: {
        ids: userIds,
      },
    });
  }
}
