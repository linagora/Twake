import { logger } from "../../../../core/platform/framework/logger";
import {
  IncomingPubsubMessage,
  PubsubServiceSubscription,
} from "../../../../core/platform/services/pubsub/api";
import { MessageNotification } from "../../../messages/types";
import { NotificationEngine } from "../engine";

const MESSAGE_CREATED_TOPIC = "message:created";

export class PubsubEngineService extends PubsubServiceSubscription<NotificationEngine> {
  async doSubscribe(): Promise<void> {
    logger.info("service.notifications.engine - Subscribing to message notifications");

    this.pubsub.subscribe(MESSAGE_CREATED_TOPIC, this.onCreated.bind(this));
  }

  async onCreated(pubsubMessage: IncomingPubsubMessage<MessageNotification>): Promise<void> {
    logger.info("service.notifications.pubsub.event - New message received");
    // TODO: validate data
    console.log(pubsubMessage);

    try {
      this.service.process(pubsubMessage.data);
    } catch (err) {
      logger.error({ err }, "Problem while subsmitting new message to engine");
      // TODO send back error to pubsub
    }
  }
}
