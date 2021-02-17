import { logger } from "../../../../../core/platform/framework";
import { PubsubHandler } from "../../../../../core/platform/services/pubsub/api";
import {
  ChannelActivityNotification,
  ChannelSystemExecutionContext,
} from "../../../types";
import { ChannelPrimaryKey, ChannelService } from "../../../provider";
import { Service } from "../../channel/service";

export class NewChannelActivityProcessor implements PubsubHandler<ChannelActivityNotification, void> {
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
      const pk: ChannelPrimaryKey = {
        id: message.channel_id,
        workspace_id: message.workspace_id,
        company_id: message.company_id,
      };
      const context: ChannelSystemExecutionContext = {
        workspace: {
          company_id: message.company_id,
          workspace_id: message.workspace_id,
        },
      };
      (this.service as Service).updateLastActivity(pk, context);
    } catch (err) {
      logger.error(
        { err },
        `${this.name} - Error while applying channel new activity in channel ${message?.channel_id}`,
      );
    }
  }
}
