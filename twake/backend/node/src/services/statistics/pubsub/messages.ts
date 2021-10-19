import { PubsubHandler } from "../../../core/platform/services/pubsub/api";
import { getLogger } from "../../../core/platform/framework";
import { MessageNotification } from "../../messages/types";
import { StatisticsAPI } from "../types";

const logger = getLogger("statistics.pubsub.messages");

export class StatisticsMessageProcessor implements PubsubHandler<MessageNotification, void> {
  constructor(readonly service: StatisticsAPI) {}

  readonly topics = {
    in: "message:created",
  };

  readonly options = {
    unique: true,
    ack: true,
    queue: "message:created:statistics-consumer",
  };

  readonly name = "Channel::StatisticsMessageProcessor";

  validate(message: MessageNotification): boolean {
    return !!(message && message.channel_id && message.company_id && message.workspace_id);
  }

  async process(message: MessageNotification): Promise<void> {
    logger.info(`${this.name} - Processing increasing messages counter for ${message.company_id}`);
    try {
      await this.service.increase(message.company_id, "messages");
    } catch (err) {
      logger.error(
        { err },
        `${this.name} - Error while processing direct channel members for message ${message.thread_id}/${message.id} in channel ${message.channel_id}`,
      );
    }
  }
}
