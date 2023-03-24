import { MessageLocalEvent, MessageNotification } from "../../../../types";
import { ParticipantObject, Thread } from "../../../../entities/threads";
import { logger } from "../../../../../../core/platform/framework";
import { Channel } from "../../../../../channels/entities";
import { isDirectChannel } from "../../../../../channels/utils";
import { ChannelActivityNotification } from "../../../../../channels/types";
import { getMentions } from "../../../utils";
import {
  ExecutionContext,
  Pagination,
} from "../../../../../../core/platform/framework/api/crud-service";
import { Message } from "../../../../../../services/messages/entities/messages";
import gr from "../../../../../global-resolver";

export class MessageToNotificationsProcessor {
  private name = "MessageToNotificationsProcessor";

  async init() {
    //
  }

  async process(
    thread: Thread,
    message: MessageLocalEvent,
    context?: ExecutionContext,
  ): Promise<void> {
    logger.debug(`${this.name} - Share message with notification microservice`);

    if (message.resource.ephemeral) {
      logger.debug(`${this.name} - Cancel because message is ephemeral`);
      return;
    }

    try {
      const messageResource = message.resource;

      for (const participant of thread.participants) {
        if (participant.type !== "channel") {
          continue;
        }

        const channel: Channel = await gr.services.channels.channels.get(
          {
            id: participant.id,
            company_id: participant.company_id,
            workspace_id: participant.workspace_id,
          },
          context,
        );

        if (!channel) {
          continue;
        }

        const company = await gr.services.companies.getCompany({ id: participant.company_id });

        const companyName = company?.name || "";
        let workspaceName = "";
        let senderName = "Twake";
        if (messageResource.user_id) {
          const user = await gr.services.users.get({ id: messageResource.user_id });
          senderName =
            `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
            `@${user?.username_canonical}`;
        }

        let title = "";
        let text = (messageResource.text || "").substr(0, 255);
        const body = messageResource.text; // we need original body just in case text gets updated further on
        if (isDirectChannel(channel)) {
          title = `${senderName} in ${companyName}`;
        } else {
          const workspace =
            (await gr.services.companies.getCompany({ id: participant.workspace_id })) || null;
          workspaceName = workspace?.name || workspaceName;
          title = `${channel.name} in ${companyName} • ${workspaceName}`;
          text = `${senderName}: ${text}`;
        }

        const mentions = await getMentions(messageResource, async (username: string) => {
          return await gr.services.users.getByUsername(username);
        });

        const messageEvent: MessageNotification = {
          company_id: participant.company_id,
          workspace_id: participant.workspace_id || "direct",
          channel_id: participant.id,
          thread_id: messageResource.thread_id,
          id: messageResource.id,
          sender: messageResource.user_id,
          creation_date: messageResource.created_at,

          mentions,

          sender_name: senderName,
          channel_name: channel.name,
          company_name: companyName,
          workspace_name: workspaceName,

          title: title,
          text: text,
        };

        const channelEvent: ChannelActivityNotification = {
          company_id: participant.company_id,
          workspace_id: participant.workspace_id || "direct",
          channel_id: participant.id,
          date: messageResource.created_at,
          sender: messageResource.user_id,
          sender_name: senderName,
          title: title,
          text: text,
          body: body,
        };

        if (messageResource.type === "message" && messageResource.subtype !== "system") {
          logger.info(
            `${this.name} - Forward message ${messageResource.id} to channel:activity and message:created / message:updated`,
          );

          if (
            message.created ||
            (await this.isLastActivityMessageDeleted(participant, messageResource, message))
          ) {
            await gr.platformServices.messageQueue.publish<ChannelActivityNotification>(
              "channel:activity",
              {
                data: channelEvent,
              },
            );
          }

          await gr.platformServices.messageQueue.publish<MessageNotification>(
            message.created ? "message:created" : "message:updated",
            {
              data: messageEvent,
            },
          );
        } else {
          logger.debug(`${this.name} - Cancel because this is system message`);
        }
      }
    } catch (err) {
      logger.warn({ err }, `${this.name} - Error while publishing`);
    }
  }

  async isLastActivityMessageDeleted(
    participant: ParticipantObject,
    messageResource: Message,
    message: MessageLocalEvent,
  ): Promise<boolean> {
    if (participant.company_id && participant.workspace_id && participant.id) {
      const list = await gr.services.messages.views.listChannel(
        new Pagination("", "1"),
        {
          include_users: false,
          replies_per_thread: 1,
          emojis: false,
        },
        {
          channel: {
            company_id: participant.company_id,
            workspace_id: participant.workspace_id,
            id: participant.id,
          },
          user: {
            id: messageResource.user_id,
          },
        },
      );

      return (
        list.getEntities().pop()?.id === message.resource.id &&
        messageResource.subtype === "deleted"
      );
    }
  }
}
