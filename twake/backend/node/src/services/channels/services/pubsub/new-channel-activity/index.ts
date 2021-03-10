import { logger } from "../../../../../core/platform/framework";
import { PubsubHandler } from "../../../../../core/platform/services/pubsub/api";
import { ChannelActivityNotification } from "../../../types";
import { ChannelService } from "../../../provider";

export class NewChannelActivityProcessor
  implements PubsubHandler<ChannelActivityNotification, void> {
  constructor(readonly service: ChannelService) {}

  readonly topics = {
    in: "channel:activity",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  readonly name = "NewChannelActivityProcessor";

  validate(message: ChannelActivityNotification): boolean {
    return !!(message && message.channel_id && message.company_id && message.workspace_id);
  }

  async process(message: ChannelActivityNotification): Promise<void> {
    logger.info(`${this.name} - Processing new activity in channel ${message.channel_id}`);

    try {
      this.service.updateLastActivity(
        {
          channel: {
            id: message.channel_id,
            workspace_id: message.workspace_id,
            company_id: message.company_id,
          },
          message: {
            date: message.date,
            sender: message.sender,
            title: message.title,
            text: message.text,
          },
        },
        {
          workspace: {
            workspace_id: message.workspace_id,
            company_id: message.company_id,
          },
          user: {
            id: message.sender,
          },
        },
      );
    } catch (err) {
      logger.error(
        { err },
        `${this.name} - Error while applying channel new activity in channel ${message?.channel_id}`,
      );
    }
  }
}
