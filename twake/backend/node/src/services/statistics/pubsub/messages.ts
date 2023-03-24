import { MessageQueueHandler } from "../../../core/platform/services/message-queue/api";
import { getLogger } from "../../../core/platform/framework";
import { MessageNotification } from "../../messages/types";
import gr from "../../global-resolver";

const logger = getLogger("statistics.messages");

export class StatisticsMessageProcessor implements MessageQueueHandler<MessageNotification, void> {
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
      await gr.services.statistics.increase(message.company_id, "messages");
    } catch (err) {
      logger.error(
        { err },
        `${this.name} - Error while processing direct channel members for message ${message.thread_id}/${message.id} in channel ${message.channel_id}`,
      );
    }
  }
}
