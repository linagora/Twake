import { logger } from "../../../../core/platform/framework/logger";
import {
  IncomingPubsubMessage,
  PubsubServiceSubscription,
} from "../../../../core/platform/services/pubsub/api";
import { UserNotificationBadgeServiceAPI } from "../../api";

/**
 * TODO: Subscribe to channel read events which will remove the entry for the user related to channel
 */
export class BadgePubsubService extends PubsubServiceSubscription {
  constructor(protected service: UserNotificationBadgeServiceAPI) {
    super();
  }

  async doSubscribe(): Promise<void> {
    logger.info("service.notifications.badge - Subscribing to pubsub notifications");
    this.pubsub.subscribe("channel:read", this.onRead.bind(this));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onRead(message: IncomingPubsubMessage<any>): Promise<void> {
    logger.debug(
      "service.notifications.pubsub.event - Channel has been marked as read, cleaning badges",
    );
  }
}
