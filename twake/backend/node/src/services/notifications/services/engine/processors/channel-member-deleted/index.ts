import { assign, merge } from "lodash";
import { ChannelMemberNotificationPreference, UserNotificationBadge } from "../../../../entities";
import { logger } from "../../../../../../core/platform/framework";
import { NotificationPubsubHandler, NotificationServiceAPI } from "../../../../api";
import { Channel, ChannelMember } from "../../../../../channels/entities";
import { isDirectChannel } from "../../../../../channels/utils";

type LeaveChannelMessage = { channel: Channel; member: ChannelMember };

export class LeaveChannelMessageProcessor
  implements NotificationPubsubHandler<LeaveChannelMessage, void> {
  constructor(readonly service: NotificationServiceAPI) {}

  readonly topics = {
    in: "channel:member:deleted",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  readonly name = "LeaveChannelMessageProcessor";

  validate(message: LeaveChannelMessage): boolean {
    return !!(message && message.channel && message.member);
  }

  async process(message: LeaveChannelMessage): Promise<void> {
    logger.info(
      `${this.name} - Processing leave channel message for user ${message.member.user_id} in channel ${message.channel.id}`,
    );

    if (Channel.isDirectChannel(message.channel)) {
      logger.info(
        `${this.name} - Channel is direct, do not clean resources for user ${message.member.user_id} in channel ${message.channel.id}`,
      );
      return;
    }

    await Promise.all([this.removeBadges(message), this.removePreferences(message)]);
  }

  async removeBadges(message: LeaveChannelMessage): Promise<void> {
    logger.info(
      `${this.name} - Removing badges for user ${message.member.user_id} in channel ${message.channel.id}`,
    );

    try {
      const badgeEntity = new UserNotificationBadge();
      assign(badgeEntity, {
        workspace_id: message.channel.workspace_id,
        company_id: message.channel.company_id,
        channel_id: message.channel.id,
        user_id: message.member.user_id,
      });
      const removedBadges = await this.service.badges.removeUserChannelBadges(badgeEntity);

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

  async removePreferences(message: LeaveChannelMessage): Promise<void> {
    if (isDirectChannel(message.channel)) {
      logger.info(
        `${this.name} - Notification preference was kept for user ${message.member.user_id} in direct channel ${message.channel.id}`,
      );
      return;
    }

    try {
      const preference = merge(new ChannelMemberNotificationPreference(), {
        channel_id: message.member.channel_id,
        company_id: message.member.company_id,
        user_id: message.member.user_id,
      });

      await this.service.channelPreferences.delete(preference);

      logger.info(
        `${this.name} - Notification preference has been deleted for user ${message.member.user_id} in channel ${message.channel.id}`,
      );
    } catch (err) {
      logger.warn(
        { err },
        `${this.name} - Error while removing preferences for user ${message.member.user_id} in channel ${message.channel.id}`,
      );
    }
  }
}
