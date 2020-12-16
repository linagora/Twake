import { NotificationPubsubHandler, NotificationServiceAPI } from "../../../../api";
import { logger } from "../../../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../../../core/platform/services/pubsub/api";
import { MobilePushNotifier } from "../../../../../notifications/notifiers";
import { ChannelMemberNotificationPreference } from "../../../../entities";
import {
  CounterUpdateMessage,
  MentionNotification,
  MentionNotificationResult,
} from "../../../../types";

/**
 * Push new message notification to a set of users
 */
export class PushNotificationToUsersMessageProcessor
  implements NotificationPubsubHandler<MentionNotification, MentionNotificationResult> {
  constructor(readonly service: NotificationServiceAPI, private pubsub: PubsubServiceAPI) {}

  readonly topics = {
    in: "notification:mentions",
  };

  name = "PushNotificationToUsersMessageProcessor";

  async process(message: MentionNotification): Promise<MentionNotificationResult> {
    logger.info(`${this.name} - Processing mention notification for channel ${message.channel_id}`);

    if (
      !message.channel_id ||
      !message.company_id ||
      !message.workspace_id ||
      !message.creation_date
    ) {
      throw new Error(`${this.name} - Missing required fields`);
    }

    if (!message.mentions || !message.mentions.users || !message.mentions.users.length) {
      logger.info(`${this.name} - Message does not have any `);
      return;
    }

    const usersToUpdate = await this.filterUsersOnLastReadChannelTime(
      { channel_id: message.channel_id, company_id: message.company_id },
      message.mentions.users,
      message.creation_date,
    );

    // update the counters in parallel than sending the notification
    const counters = await this.incrementMessageCount(
      { channel_id: message.channel_id, company_id: message.company_id },
      usersToUpdate,
    );

    counters.forEach(counter => {
      this.sendPushNotification(counter.user, {
        company_id: message.company_id,
        workspace_id: message.workspace_id,
        channel_id: message.channel_id,
        user: counter.user,
        value: counter.count,
      });
    });

    return;
  }

  async filterUsersOnLastReadChannelTime(
    channel: Pick<ChannelMemberNotificationPreference, "channel_id" | "company_id">,
    users: string[] = [],
    timestamp: number,
  ): Promise<string[]> {
    if (!users.length) {
      return [];
    }

    const preferences: ChannelMemberNotificationPreference[] = (
      await this.service.channelPreferences.getChannelPreferencesForUsers(channel, users)
    ).getEntities();

    return preferences
      .filter(preference => preference.last_read < timestamp)
      .map(preference => preference.user_id);
  }

  async incrementMessageCount(
    channel: Pick<ChannelMemberNotificationPreference, "channel_id" | "company_id">,
    users: string[] = [],
  ): Promise<
    Array<{
      user: string;
      count: number;
    }>
  > {
    logger.info(`TODO: increment message count for users ${users.join("/")}`);

    return users.map(user => ({ user, count: 1 }));
  }

  sendPushNotification(user: string, counterUpdate: CounterUpdateMessage): void {
    MobilePushNotifier.get(this.pubsub).notify(user, counterUpdate);
  }
}
