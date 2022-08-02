import { MessageHook, MessageLocalEvent } from "../../../../types";
import { ParticipantObject, Thread } from "../../../../entities/threads";
import { logger } from "../../../../../../core/platform/framework";
import { Channel } from "../../../../../channels/entities";
import {
  ExecutionContext,
  Pagination,
} from "../../../../../../core/platform/framework/api/crud-service";
import { Message } from "../../../../entities/messages";
import gr from "../../../../../global-resolver";

export class MessageToHooksProcessor {
  private name = "MessageToHooksProcessor";

  async init() {
    return this;
  }

  async process(
    thread: Thread,
    message: MessageLocalEvent,
    context?: ExecutionContext,
  ): Promise<void> {
    logger.debug(`${this.name} - Share message with channel microservice for hooks`);

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

        for (const appId of channel.connectors) {
          if (message.resource.application_id !== appId) {
            //Publish hook
            await gr.platformServices.messageQueue.publish<MessageHook>(
              "application:hook:message",
              {
                data: {
                  type: "message",
                  application_id: appId,
                  company_id: participant.company_id,
                  channel: channel,
                  thread: thread,
                  message: messageResource,
                },
              },
            );
          }
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
