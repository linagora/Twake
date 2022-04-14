import _ from "lodash";
import { UserNotificationBadge } from "../../../entities";
import { logger } from "../../../../../core/platform/framework";
import { NotificationPubsubHandler } from "../../../api";
import { ChannelUnreadMessage } from "../../../types";
import gr from "../../../../global-resolver";

export class MarkChannelAsUnreadMessageProcessor
  implements NotificationPubsubHandler<ChannelUnreadMessage, void>
{
  readonly topics = {
    in: "channel:unread",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  readonly name = "MarkChannelAsUnreadMessageProcessor";

  validate(message: ChannelUnreadMessage): boolean {
    return !!(
      message &&
      message.channel &&
      message.channel.workspace_id &&
      message.channel.company_id &&
      message.channel.id &&
      message.member &&
      message.member.user_id
    );
  }

  async process(message: ChannelUnreadMessage): Promise<void> {
    logger.info(
      `${this.name} - Processing message for user ${message.member.user_id} in channel ${message.channel.id}`,
    );

    await this.addBadge(message);
  }

  async addBadge(message: ChannelUnreadMessage): Promise<void> {
    logger.info(
      `${this.name} - Creating a badge for user ${message.member.user_id} in channel ${message.channel.id}`,
    );

    try {
      const badgeEntity = new UserNotificationBadge();
      _.assign(badgeEntity, {
        workspace_id: message.channel.workspace_id,
        company_id: message.channel.company_id,
        channel_id: message.channel.id,
        user_id: message.member.user_id,
      });
      gr.services.notifications.badges.save(badgeEntity);

      logger.info(
        `${this.name} - Created new badge for user ${message.member.user_id} in channel ${message.channel.id}`,
      );
    } catch (err) {
      logger.warn(
        { err },
        `${this.name} - Error while creating new badge for user ${message.member.user_id} in channel ${message.channel.id}`,
      );
    }
  }
}
