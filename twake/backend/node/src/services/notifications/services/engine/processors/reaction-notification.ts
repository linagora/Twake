import { PushNotificationMessage, ReactionNotification } from "../../../types";
import { NotificationPubsubHandler } from "../../../api";
import { logger } from "../../../../../core/platform/framework";
import { eventBus } from "../../../../../core/platform/services/realtime/bus";
import {
  RealtimeEntityActionType,
  ResourcePath,
} from "../../../../../core/platform/services/realtime/types";
import { MobilePushNotifier } from "../../../notifiers";
import gr from "../../../../global-resolver";
import { getNotificationRoomName } from "../../realtime";

export class PushReactionNotification
  implements NotificationPubsubHandler<ReactionNotification, void>
{
  readonly topics = {
    in: "notification:reaction",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  name = "PushReactionToUsersMessageProcessor";

  validate(message: ReactionNotification): boolean {
    return !!(
      message &&
      message.message_id &&
      message.channel_id &&
      message.company_id &&
      message.workspace_id &&
      message.thread_id &&
      message.user_id &&
      message.reaction &&
      message.creation_date
    );
  }

  async process(message: ReactionNotification): Promise<void> {
    logger.info(
      `${this.name} - Processing reaction notification for message ${message.message_id}`,
    );

    if (
      !message.company_id ||
      !message.workspace_id ||
      !message.channel_id ||
      !message.message_id ||
      !message.thread_id ||
      !message.reaction ||
      !message.user_id ||
      !message.creation_date
    ) {
      throw new Error("Missing required fields");
    }

    const location = {
      company_id: message.company_id,
      workspace_id: message.workspace_id,
      channel_id: message.channel_id,
      user: message.user_id.toString(),
      thread_id: message.thread_id || message.message_id,
      message_id: message.message_id,
    };

    eventBus.publish(RealtimeEntityActionType.Event, {
      type: "notification:desktop",
      room: ResourcePath.get(getNotificationRoomName(message.user_id)),
      entity: {
        ...location,
        title: "new reaction",
        text: "user +1  message content",
      },
      resourcePath: null,
      result: null,
    });

    this.sendPushNotification(message.user_id, {
      ...location,
      title: "new reaction",
      text: "user +1  message content",
    });
  }

  sendPushNotification(user: string, reaction: PushNotificationMessage): void {
    MobilePushNotifier.get(gr.platformServices.pubsub).notify(user, reaction);
  }
}
