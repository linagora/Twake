import { PubsubHandler } from "../../../core/platform/services/pubsub/api";
import { getLogger, TwakeLogger } from "../../../core/platform/framework";
import {
  RealtimeEntityActionType,
  ResourcePath,
} from "../../../core/platform/services/realtime/types";
import { eventBus } from "../../../core/platform/services/realtime/bus";
import { UsersOnlineMessage } from "../api";
import { ONLINE_TOPIC } from "../constants";
import _ from "lodash";

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
    this.logger.debug(
      `Pushing user online status for users ${message.map(u => u.user_id).join(",")}`,
    );

    const grouped_data = _.groupBy(message, "company_id");

    Object.values(grouped_data).forEach((messagePerCompany: UsersOnlineMessage) => {
      eventBus.publish(RealtimeEntityActionType.Event, {
        type: "user:online",
        room: ResourcePath.get(`/users/online/${messagePerCompany[0].company_id}`),
        entity: messagePerCompany,
        resourcePath: null,
        result: null,
      });
    });

    return;
  }
}
