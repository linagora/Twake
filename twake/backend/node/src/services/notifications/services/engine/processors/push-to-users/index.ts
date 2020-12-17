import { NotificationPubsubHandler, NotificationServiceAPI } from "../../../../api";
import { logger } from "../../../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../../../core/platform/services/pubsub/api";
import { MobilePushNotifier } from "../../../../../notifications/notifiers";
import {
  CounterUpdateMessage,
  MentionNotification,
  MentionNotificationResult,
} from "../../../../types";
import { ChannelMemberNotificationPreference } from "../../../../../../services/notifications/entities/channel-member-notification-preferences";
import {
  UserNotificationBadge,
  UserNotificationBadgePrimaryKey,
} from "../../../../../../services/notifications/entities/user-notification-badges";

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
      logger.info(`${this.name} - Message does not have any user to mention`);
      return;
    }

    const usersToUpdate = await this.filterUsersOnLastReadChannelTime(
      { channel_id: message.channel_id, company_id: message.company_id },
      message.mentions.users,
      message.creation_date,
    );

    if (!usersToUpdate.length) {
      logger.info(`${this.name} - There are no users to notify from the last read channel date`);
      return;
    }

    const badges = await this.addNewMessageBadgesForUsers(
      {
        channel_id: message.channel_id,
        company_id: message.company_id,
        workspace_id: message.workspace_id,
        thread_id: message.thread_id,
      },
      usersToUpdate,
    );

    badges.forEach(badge =>
      this.sendPushNotification(badge.user_id, {
        company_id: message.company_id,
        workspace_id: message.workspace_id,
        channel_id: message.channel_id,
        user: badge.user_id,
        value: 1,
      }),
    );
  }

  async filterUsersOnLastReadChannelTime(
    channel: Pick<ChannelMemberNotificationPreference, "channel_id" | "company_id">,
    users: string[] = [],
    timestamp: number,
  ): Promise<string[]> {
    if (!users.length) {
      return [];
    }

    return (
      await this.service.channelPreferences.getChannelPreferencesForUsers(channel, users, {
        lessThan: timestamp,
      })
    )
      .getEntities()
      .map((preference: ChannelMemberNotificationPreference) => preference.user_id);
  }

  async addNewMessageBadgesForUsers(
    badge: Pick<
      UserNotificationBadgePrimaryKey,
      "channel_id" | "company_id" | "thread_id" | "workspace_id"
    >,
    users: string[] = [],
  ): Promise<Array<UserNotificationBadge>> {
    logger.info(`${this.name} - Update badge for users ${users.join("/")}`);

    return (
      await Promise.all(
        users.map(user =>
          this.saveBadge({
            channel_id: badge.channel_id,
            company_id: badge.company_id,
            workspace_id: badge.workspace_id,
            thread_id: badge.thread_id,
            user_id: user,
          }),
        ),
      )
    ).filter(Boolean);
  }

  private saveBadge(badge: UserNotificationBadge): Promise<UserNotificationBadge> {
    return this.service.badges
      .save(badge)
      .then(result => result.entity)
      .catch(err => {
        logger.warn({ err }, `${this.name} - A badge has not been saved for user ${badge.user_id}`);
        return null;
      });
  }

  sendPushNotification(user: string, counterUpdate: CounterUpdateMessage): void {
    MobilePushNotifier.get(this.pubsub).notify(user, counterUpdate);
  }
}
