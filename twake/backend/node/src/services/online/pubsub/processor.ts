import { PubsubHandler } from "../../../core/platform/services/pubsub/api";
import { getLogger, TwakeLogger } from "../../../core/platform/framework";
import {
  RealtimeEntityActionType,
  ResourcePath,
} from "../../../core/platform/services/realtime/types";
import { websocketEventBus } from "../../../core/platform/services/realtime/bus";
import { UsersOnlineMessage } from "../types";
import { ONLINE_TOPIC } from "../constants";

export class UserOnlineProcessor implements PubsubHandler<UsersOnlineMessage, void> {
  private logger: TwakeLogger;
  readonly topics = {
    in: ONLINE_TOPIC,
  };

  readonly options = {
    unique: false,
    ack: true,
  };

  readonly name = "UserOnlineProcessor";

  constructor() {
    this.logger = getLogger(`online.pubsub.${this.name}`);
  }

  validate(message: UsersOnlineMessage): boolean {
    return !!(message && message.length);
  }

  async process(message: UsersOnlineMessage): Promise<void> {
    this.logger.debug(`Pushing user online status for users ${message.map(u => u[0]).join(",")}`);

    // TODO: We can not push all users to all websockets, we need to categorize them per company and then push them in specific topic per company

    websocketEventBus.publish(RealtimeEntityActionType.Event, {
      type: "user:online",
      room: ResourcePath.get("/users/online"),
      entity: message,
      resourcePath: null,
      result: null,
    });

    return;
  }
}
