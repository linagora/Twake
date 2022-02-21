import {
  ChannelMemberNotificationPreference,
  getNotificationPreferenceInstance,
} from "../../../../entities";
import { logger } from "../../../../../../core/platform/framework";
import { NotificationPubsubHandler, NotificationServiceAPI } from "../../../../api";
import { Channel, ChannelMember } from "../../../../../channels/entities";

type JoinChannelMessage = { channel: Channel; member: ChannelMember };

export class JoinChannelMessageProcessor
  implements NotificationPubsubHandler<JoinChannelMessage, void>
{
  constructor(readonly service: NotificationServiceAPI) {}

  readonly topics = {
    in: "channel:member:created",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  readonly name = "JoinChannelMessageProcessor";

  validate(message: JoinChannelMessage): boolean {
    logger.info(
      `${this.name} - Validating join channel message for user ${
        message.member.user_id
      } in channel ${message.channel.id}, full message: ${JSON.stringify(message)}`,
    );
    return !!(message && message.channel && message.member);
  }

  async process(message: JoinChannelMessage): Promise<void> {
    logger.info(
      `${this.name} - Processing join channel message for user ${message.member.user_id} in channel ${message.channel.id}`,
    );

    try {
      let preference: ChannelMemberNotificationPreference;

      if (Channel.isDirectChannel(message.channel)) {
        // Check if the user already have preference for this channel in case he already joined it before
        preference = await this.service.channelPreferences.get({
          company_id: message.member.company_id,
          channel_id: message.member.channel_id,
          user_id: message.member.user_id,
        });
      }

      if (preference) {
        logger.info(
          `${this.name} - Notification preference already exists for user ${message.member.user_id} in direct channel ${message.channel.id}`,
        );

        return;
      }

      preference = getNotificationPreferenceInstance({
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
