import { NotificationPubsubHandler, NotificationServiceAPI } from "../../../../api";
import { logger } from "../../../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../../../core/platform/services/pubsub/api";
import { MobilePushNotifier } from "../../../../../notifications/notifiers";
import {
  PushNotificationMessage,
  MentionNotification,
  MentionNotificationResult,
} from "../../../../types";
import { ChannelMemberNotificationPreference } from "../../../../../../services/notifications/entities/channel-member-notification-preferences";
import { UserNotificationBadge } from "../../../../../../services/notifications/entities/user-notification-badges";
import _ from "lodash";
import { eventBus } from "../../../../../../core/platform/services/realtime/bus";
import {
  RealtimeEntityActionType,
  ResourcePath,
} from "../../../../../../core/platform/services/realtime/types";
import { getNotificationRoomName } from "../../../realtime";

/**
 * Push new message notification to a set of users
 */
export class PushNotificationToUsersMessageProcessor
  implements NotificationPubsubHandler<MentionNotification, MentionNotificationResult>
{
  constructor(readonly service: NotificationServiceAPI, private pubsub: PubsubServiceAPI) {}

  readonly topics = {
    in: "notification:mentions",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  name = "PushNotificationToUsersMessageProcessor";

  validate(message: MentionNotification): boolean {
    return !!(
      message &&
      message.channel_id &&
      message.company_id &&
      message.workspace_id &&
      message.creation_date
    );
  }

  async process(message: MentionNotification): Promise<MentionNotificationResult> {
    logger.info(`${this.name} - Processing mention notification for channel ${message.channel_id}`);

    if (
      !message.company_id ||
      !message.workspace_id ||
      !message.channel_id ||
      !message.creation_date
    ) {
      throw new Error("Missing required fields");
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
        thread_id: message.thread_id || message.message_id,
        message_id: message.message_id,
      },
      usersToUpdate,
    );

    badges.forEach(badge => {
      const badgeLocation = {
        company_id: message.company_id,
        workspace_id: message.workspace_id,
        channel_id: message.channel_id,
        user: badge.user_id.toString(),
        thread_id: message.thread_id || message.message_id,
        message_id: message.message_id,
      };

      eventBus.publish(RealtimeEntityActionType.Event, {
        type: "notification:desktop",
        room: ResourcePath.get(getNotificationRoomName(badge.user_id)),
        entity: {
          ...badgeLocation,
          title: message.title,
          text: formatNotificationMessage(message),
        },
        resourcePath: null,
        result: null,
      });

      this.sendPushNotification(badge.user_id, {
        ...badgeLocation,
        badge_value: 1,
        title: message.title,
        text: formatNotificationMessage(message),
      });
    });
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
      UserNotificationBadge,
      "channel_id" | "company_id" | "thread_id" | "workspace_id" | "message_id"
    >,
    users: string[] = [],
  ): Promise<Array<UserNotificationBadge>> {
    logger.info(`${this.name} - Update badge for users ${users.join("/")}`);

    return (
      await Promise.all(
        users.map(user => {
          const badgeEntity = new UserNotificationBadge();
          _.assign(badgeEntity, {
            channel_id: badge.channel_id,
            company_id: badge.company_id,
            workspace_id: badge.workspace_id,
            thread_id: badge.thread_id,
            message_id: badge.message_id,
            user_id: user,
          });
          return this.saveBadge(badgeEntity);
        }),
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

  sendPushNotification(user: string, pushNotification: PushNotificationMessage): void {
    MobilePushNotifier.get(this.pubsub).notify(user, pushNotification);
  }
}

function formatNotificationMessage(message: MentionNotification): string {
  let text = message.text;
  // Clean the message text to remove @userName:id-id-id
  ((text || "").match(/@[^: ]+:([0-f-]{36})/gm) || []).forEach(match => {
    const string = (match || "").trim();
    const id = string.split(":").pop();
    const fallback = string.split(":").shift();
    text = text.replace(string, message.object_names?.users[id] || fallback);
  });
  // Clean the message text to remove #channelName:id-id-id
  ((text || "").match(/#[^: ]+:([0-f-]{36})/gm) || []).forEach(match => {
    const string = (match || "").trim();
    const id = string.split(":").pop();
    const fallback = string.split(":").shift();
    text = text.replace(string, message.object_names?.channels[id] || fallback);
  });
  return text;
}
