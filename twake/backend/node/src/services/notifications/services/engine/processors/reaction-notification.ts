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
import { Channel } from "../../../../channels/entities/channel";
import User from "../../../../user/entities/user";
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

    const { title, text } = await this.buildNotificationMessageContent(message);

    eventBus.publish(RealtimeEntityActionType.Event, {
      type: "notification:desktop",
      room: ResourcePath.get(getNotificationRoomName(message.user_id)),
      entity: {
        ...location,
        title,
        text,
      },
      resourcePath: null,
      result: null,
    });

    this.sendPushNotification(message.user_id, {
      ...location,
      title,
      text,
    });
  }

  sendPushNotification(user: string, reaction: PushNotificationMessage): void {
    MobilePushNotifier.get(gr.platformServices.pubsub).notify(user, reaction);
  }

  async buildNotificationMessageContent(
    message: ReactionNotification,
  ): Promise<{ title: string; text: string }> {
    const { company_id, workspace_id, user_id, reaction, thread_id } = message;
    let title = "";

    const channel: Channel = await gr.services.channels.channels.get({
      id: message.channel_id,
      company_id: company_id,
      workspace_id: workspace_id,
    });

    const [company, workspace, user] = await Promise.all([
      gr.services.companies.getCompany({ id: company_id }),
      gr.services.workspaces.get({
        company_id: company_id,
        id: workspace_id,
      }),
      gr.services.users.get({ id: user_id }),
    ]);

    //get message
    const msg = await gr.services.messages.messages.get({
      thread_id: thread_id,
      id: message.message_id,
    });

    const companyName = company?.name || "";
    const workspaceName = workspace?.name || "";
    const userName = this.getUserName(user) || "Twake";

    if (Channel.isDirectChannel(channel)) {
      title = `${userName} in ${companyName}`;
    } else {
      title = `${channel.name} in ${companyName} • ${workspaceName}`;
    }

    return {
      title,
      text: `${userName}: ${reaction} to ${msg?.text}`,
    };
  }

  getUserName(user: User): string {
    return (
      `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || `@${user?.username_canonical}`
    );
  }
}
