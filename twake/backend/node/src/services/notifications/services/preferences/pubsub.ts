import { ChannelMember, Channel } from "../../../../services/channels/entities";
import { logger } from "../../../../core/platform/framework/logger";
import {
  IncomingPubsubMessage,
  PubsubServiceSubscription,
} from "../../../../core/platform/services/pubsub/api";
import { ChannelMemberPreferencesServiceAPI } from "../../api";
import { ChannelMemberNotificationPreference } from "../../entities";

export class NotificationPubsubService extends PubsubServiceSubscription<
  ChannelMemberPreferencesServiceAPI
> {
  async doSubscribe(): Promise<void> {
    logger.info("service.notifications - Subscribing to pubsub notifications");
    this.pubsub.subscribe("channel:member:created", async (message: IncomingPubsubMessage) => {
      logger.debug(
        "service.notifications.pubsub.event - Member as been created, creating notification preference",
      );
      const notification: { channel: Channel; member: ChannelMember } = message.data;

      if (!notification.channel || !notification.member) {
        logger.warn("Channel or ChannelMember are not defined in the pubsub message");

        return;
      }

      const preference: ChannelMemberNotificationPreference = {
        channel_id: notification.member.channel_id,
        company_id: notification.member.company_id,
        user_id: notification.member.user_id,
        last_read: 0,
        preferences: notification.member.notification_level,
      };

      // TODO: Check if preference is well filled

      try {
        await this.service.create(preference);

        logger.info(
          "service.notifications.pubsub.event - Notification preference has been created",
        );
      } catch (err) {
        logger.error(
          { err },
          "service.notifications.pubsub.event - Error while creating notification preference from pubsub",
        );
      }
    });

    this.pubsub.subscribe("channel:member:updated", (message: IncomingPubsubMessage) => {
      logger.debug("service.notifications.pubsub.event - Member as been updated", message.data);
    });

    this.pubsub.subscribe("channel:member:deleted", (message: IncomingPubsubMessage) => {
      logger.debug("service.notifications.pubsub.event - Member as been deleted", message.data);
    });
  }
}
