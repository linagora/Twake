import { ChannelMember, Channel } from "../../../../services/channels/entities";
import { logger } from "../../../../core/platform/framework/logger";
import {
  IncomingPubsubMessage,
  PubsubServiceSubscription,
} from "../../../../core/platform/services/pubsub/api";
import { ChannelMemberPreferencesServiceAPI } from "../../api";
import { ChannelMemberNotificationPreference } from "../../entities";
import { merge } from "lodash";

type PreferencesNotification = { channel: Channel; member: ChannelMember };

export class NotificationPubsubService extends PubsubServiceSubscription {
  constructor(protected service: ChannelMemberPreferencesServiceAPI) {
    super();
  }

  async doSubscribe(): Promise<void> {
    logger.info("service.notifications - Subscribing to pubsub notifications");
    this.pubsub.subscribe("channel:member:created", this.onCreated.bind(this));

    this.pubsub.subscribe("channel:member:updated", this.onUpdated.bind(this));
  }

  async onCreated(message: IncomingPubsubMessage<PreferencesNotification>): Promise<void> {
    logger.debug(
      "service.notifications.pubsub.event - Member as been created, creating notification preference",
    );
    const notification = message.data;

    if (!notification.channel || !notification.member) {
      logger.warn(
        "service.notifications.pubsub.event - Channel or ChannelMember are not defined in the pubsub message",
      );

      return;
    }

    let preference = new ChannelMemberNotificationPreference();

    preference = merge(preference, {
      channel_id: notification.member.channel_id,
      company_id: notification.member.company_id,
      user_id: notification.member.user_id,
      last_read: notification.member.last_access || 0,
      preferences: notification.member.notification_level,
    });

    try {
      await this.service.save(preference);

      logger.info("service.notifications.pubsub.event - Notification preference has been created");
    } catch (err) {
      logger.error(
        { err },
        "service.notifications.pubsub.event - Error while creating notification preference from pubsub",
      );
    }
  }

  async onUpdated(message: IncomingPubsubMessage<PreferencesNotification>): Promise<void> {
    logger.info("service.notifications.pubsub.event - Notification preference has been updated");
    const notification: { channel: Channel; member: ChannelMember } = message.data;

    if (!notification.channel || !notification.member) {
      logger.warn(
        "service.notifications.pubsub.event - Channel or ChannelMember are not defined in the pubsub message",
      );

      return;
    }

    const preference = merge(new ChannelMemberNotificationPreference(), {
      channel_id: notification.member.channel_id,
      company_id: notification.member.company_id,
      user_id: notification.member.user_id,
      last_read: notification.member.last_access || 0,
      preferences: notification.member.notification_level,
    });

    try {
      await this.service.save(preference);

      logger.info("service.notifications.pubsub.event - Notification preference has been updated");
    } catch (err) {
      logger.error(
        { err },
        "service.notifications.pubsub.event - Error while updating notification preference from pubsub",
      );
    }
  }
}
