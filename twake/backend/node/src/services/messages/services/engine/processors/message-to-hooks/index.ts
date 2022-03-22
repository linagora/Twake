import { MessageHook, MessageLocalEvent, MessageNotification } from "../../../../types";
import { MessageServiceAPI } from "../../../../api";
import { DatabaseServiceAPI } from "../../../../../../core/platform/services/database/api";
import { ParticipantObject, Thread } from "../../../../entities/threads";
import { logger } from "../../../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../../../core/platform/services/pubsub/api";
import { Channel } from "../../../../../channels/entities";
import { isDirectChannel } from "../../../../../channels/utils";
import { ChannelActivityNotification } from "../../../../../channels/types";
import UserServiceAPI from "../../../../../user/api";
import ChannelServiceAPI from "../../../../../channels/provider";
import { getMentions } from "../../../utils";
import { Pagination } from "../../../../../../core/platform/framework/api/crud-service";
import { Message } from "../../../../entities/messages";

export class MessageToHooksProcessor {
  private name = "MessageToHooksProcessor";

  constructor(
    readonly database: DatabaseServiceAPI,
    private pubsub: PubsubServiceAPI,
    private user: UserServiceAPI,
    private channels: ChannelServiceAPI,
    readonly service: MessageServiceAPI,
  ) {}

  async init() {}

  async process(thread: Thread, message: MessageLocalEvent): Promise<void> {
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

        const channel: Channel = await this.channels.channels.get(
          {
            id: participant.id,
            company_id: participant.company_id,
            workspace_id: participant.workspace_id,
          },
          {
            user: { server_request: true, id: null },
            workspace: {
              company_id: participant.company_id,
              workspace_id: participant.workspace_id,
            },
          },
        );

        if (!channel) {
          continue;
        }

        for (const appId of channel.connectors) {
          if (message.resource.application_id !== appId) {
            //Publish hook
            await this.pubsub.publish<MessageHook>("application:hook:message", {
              data: {
                type: "message",
                application_id: appId,
                company_id: participant.company_id,
                channel: channel,
                thread: thread,
                message: messageResource,
              },
            });
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
      const list = await this.service.views.listChannel(
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
