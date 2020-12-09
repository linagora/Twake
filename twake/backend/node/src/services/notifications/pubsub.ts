import { logger } from "../../core/platform/framework/logger";
import { PubsubServiceAPI, IncomingPubsubMessage } from "../../core/platform/services/pubsub/api";
import { NotificationServiceAPI } from "./api";

export class NotificationPubsubService {
  constructor(private service: NotificationServiceAPI, private pubsub: PubsubServiceAPI) {}

  subscribe(): void {
    logger.info("service.notifications - Subscribing to pubsub notifications");
    this.pubsub.subscribe("channel:member:created", (message: IncomingPubsubMessage) => {
      logger.debug("service.notifications.pubsub.event - Member as been created", message.data);
    });

    this.pubsub.subscribe("channel:member:updated", (message: IncomingPubsubMessage) => {
      logger.debug("service.notifications.pubsub.event - Member as been updated", message.data);
    });

    this.pubsub.subscribe("channel:member:deleted", (message: IncomingPubsubMessage) => {
      logger.debug("service.notifications.pubsub.event - Member as been deleted", message.data);
    });
  }
}
