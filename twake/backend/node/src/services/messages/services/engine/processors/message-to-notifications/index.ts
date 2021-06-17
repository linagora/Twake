import { MessageLocalEvent, MessageNotification, specialMention } from "../../../../types";
import { MessageServiceAPI } from "../../../../api";
import { DatabaseServiceAPI } from "../../../../../../core/platform/services/database/api";
import { Thread } from "../../../../entities/threads";
import { logger } from "../../../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../../../core/platform/services/pubsub/api";
import { Channel } from "../../../../../channels/entities";
import { isDirectChannel } from "../../../../../channels/utils";
import { ChannelActivityNotification } from "../../../../../channels/types";
import UserServiceAPI from "../../../../../user/api";
import ChannelServiceAPI from "../../../../../channels/provider";

export class MessageToNotificationsProcessor {
  private name = "MessageToNotificationsProcessor";

  constructor(
    readonly database: DatabaseServiceAPI,
    private pubsub: PubsubServiceAPI,
    private user: UserServiceAPI,
    private channels: ChannelServiceAPI,
    readonly service: MessageServiceAPI,
  ) {}

  async init() {}

  async process(thread: Thread, message: MessageLocalEvent): Promise<void> {
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

        const channel: Channel = await this.channels.channels.get(
          { id: messageResource.user_id },
          {
            user: { server_request: true, id: null },
            workspace: {
              company_id: participant.company_id,
              workspace_id: participant.workspace_id,
            },
          },
        );
        const company = await this.user.companies.getCompany({ id: participant.company_id });

        let companyName = company.name;
        let workspaceName = "";
        let senderName = "Twake";
        if (messageResource.user_id) {
          const user = await this.user.users.get({ id: messageResource.user_id });
          senderName =
            `${user.first_name} ${user.last_name}`.trim() || `@${user.username_canonical}`;
        }

        let title = "";
        let text = (messageResource.text || "").substr(0, 255);
        let body = messageResource.text; // we need original body just in case text gets updated further on
        if (isDirectChannel(channel)) {
          title = `${senderName} in ${companyName}`;
        } else {
          const workspace =
            (await this.user.companies.getCompany({ id: participant.workspace_id })) || null;
          workspaceName = workspace?.name || workspaceName;
          title = `${channel.name} in ${companyName} • ${workspaceName}`;
          text = `${senderName}: ${text}`;
        }

        const usersOutput = (messageResource.text || "").match(/@[^: ]+:([0-f-]{36})/m);
        const globalOutput = (messageResource.text || "").match(
          /(^| )@(all|here|channel|everyone)([^a-z]|$)/m,
        );

        const mentions = {
          users: usersOutput.map(u => (u || "").trim()),
          specials: globalOutput.map(g => (g || "").trim()) as specialMention[],
        };

        const messageEvent: MessageNotification = {
          company_id: participant.company_id,
          workspace_id: participant.workspace_id || "direct",
          channel_id: participant.id,
          thread_id: messageResource.thread_id,
          id: messageResource.id,
          sender: messageResource.user_id,
          creation_date: messageResource.created_at,

          mentions: mentions,

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

          //Ignore system messages
          if (message.created) {
            await this.pubsub.publish<ChannelActivityNotification>("channel:activity", {
              data: channelEvent,
            });
          }

          await this.pubsub.publish<MessageNotification>(
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
}
