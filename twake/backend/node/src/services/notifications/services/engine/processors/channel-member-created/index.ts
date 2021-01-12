import { merge } from "lodash";
import { ChannelMemberNotificationPreference } from "../../../../entities";
import { logger } from "../../../../../../core/platform/framework";
import { NotificationPubsubHandler, NotificationServiceAPI } from "../../../../api";
import { Channel, ChannelMember } from "../../../../../channels/entities";

type JoinChannelMessage = { channel: Channel; member: ChannelMember };

export class JoinChannelMessageProcessor
  implements NotificationPubsubHandler<JoinChannelMessage, void> {
  constructor(readonly service: NotificationServiceAPI) {}

  readonly topics = {
    in: "channel:member:created",
  };

  readonly name = "JoinChannelMessageProcessor";

  validate(message: JoinChannelMessage): boolean {
    return !!(message && message.channel && message.member);
  }

  async process(message: JoinChannelMessage): Promise<void> {
    logger.info(
      `${this.name} - Processing join channel message for user ${message.member.user_id} in channel ${message.channel.id}`,
    );

    try {
      const preference = merge(new ChannelMemberNotificationPreference(), {
        channel_id: message.member.channel_id,
        company_id: message.member.company_id,
        user_id: message.member.user_id,
        last_read: message.member.last_access || 0,
        preferences: message.member.notification_level,
      });

      await this.service.channelPreferences.save(preference);

      logger.info(
        `${this.name} - Notification preference has been created for user ${message.member.user_id} in channel ${message.channel.id}`,
      );
    } catch (err) {
      logger.warn(
        { err },
        `${this.name} - Error while creating notification preference from pubsub`,
      );
    }
  }
}
