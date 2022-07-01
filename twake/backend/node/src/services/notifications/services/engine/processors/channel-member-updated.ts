import { merge } from "lodash";
import { ChannelMemberNotificationPreference } from "../../../entities";
import { logger } from "../../../../../core/platform/framework";
import { Channel, ChannelMember } from "../../../../channels/entities";
import gr from "../../../../global-resolver";
import { NotificationPubsubHandler } from "../../../types";

type UpdateChannelMessage = { channel: Channel; member: ChannelMember };

export class UpdateChannelMemberMessageProcessor
  implements NotificationPubsubHandler<UpdateChannelMessage, void>
{
  readonly topics = {
    in: "channel:member:updated",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  readonly name = "UpdateChannelMemberMessageProcessor";

  validate(message: UpdateChannelMessage): boolean {
    return !!(message && message.channel && message.member);
  }

  async process(message: UpdateChannelMessage): Promise<void> {
    logger.info(
      `${this.name} - Processing update channel member message for user ${message.member.user_id} in channel ${message.channel.id}`,
    );

    const preference = merge(new ChannelMemberNotificationPreference(), {
      channel_id: message.member.channel_id,
      company_id: message.member.company_id,
      user_id: message.member.user_id,
      last_read: message.member.last_access || 0,
      preferences: message.member.notification_level,
    });

    try {
      await gr.services.notifications.channelPreferences.save(preference);

      logger.info(
        `${this.name} - Channel member notification preference has been updated for user ${message.member.user_id} in channel ${message.channel.id}`,
      );
    } catch (err) {
      logger.error(
        { err },
        `${this.name} - Error while updating channel member notification preference for user ${message.member.user_id} in channel ${message.channel.id}`,
      );
    }
  }
}
