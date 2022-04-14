import _ from "lodash";
import { UserNotificationBadge } from "../../../entities";
import { logger } from "../../../../../core/platform/framework";
import { NotificationPubsubHandler } from "../../../api";
import { ChannelReadMessage } from "../../../types";
import gr from "../../../../global-resolver";

export class MarkChannelAsReadMessageProcessor
  implements NotificationPubsubHandler<ChannelReadMessage, void>
{
  readonly topics = {
    in: "channel:read",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  readonly name = "MarkChannelAsReadMessageProcessor";

  validate(message: ChannelReadMessage): boolean {
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

  async process(message: ChannelReadMessage): Promise<void> {
    logger.info(
      `${this.name} - Processing message for user ${message.member.user_id} in channel ${message.channel.id}`,
    );

    await this.removeBadges(message);
  }

  async removeBadges(message: ChannelReadMessage): Promise<void> {
    logger.info(
      `${this.name} - Removing badges for user ${message.member.user_id} in channel ${message.channel.id}`,
    );

    try {
      const badgeEntity = new UserNotificationBadge();
      _.assign(badgeEntity, {
        workspace_id: message.channel.workspace_id,
        company_id: message.channel.company_id,
        channel_id: message.channel.id,
        user_id: message.member.user_id,
      });
      const removedBadges = await gr.services.notifications.badges.removeUserChannelBadges(
        badgeEntity,
      );

      logger.info(
        `${this.name} - Removed ${removedBadges} badges for user ${message.member.user_id} in channel ${message.channel.id}`,
      );
    } catch (err) {
      logger.warn(
        { err },
        `${this.name} - Error while removing badges for user ${message.member.user_id} in channel ${message.channel.id}`,
      );
    }
  }
}
