import { without } from "lodash";
import { Channel, ChannelMember } from "../../entities";
import { getLogger } from "../../../../core/platform/framework";
import { MessageQueueHandler } from "../../../../core/platform/services/message-queue/api";
import { MessageNotification } from "../../../messages/types";
import gr from "../../../global-resolver";
import { ExecutionContext } from "../../../../core/platform/framework/api/crud-service";

const logger = getLogger("channel.message-queue.new-direct-channel-message");

export class NewDirectChannelMessageProcessor
  implements MessageQueueHandler<MessageNotification, void>
{
  readonly topics = {
    in: "message:created",
  };

  readonly options = {
    unique: true,
    ack: true,
    queue: "message:created:consumer1",
  };

  readonly name = "Channel::NewDirectChannelMessageProcessor";

  validate(message: MessageNotification): boolean {
    return !!(message && message.channel_id && message.company_id && message.workspace_id);
  }

  async process(message: MessageNotification, context?: ExecutionContext): Promise<void> {
    logger.info(
      `${this.name} - Processing notification for message ${message.thread_id}/${message.id} in channel ${message.channel_id}`,
    );
    logger.debug(`${this.name} - Notification message ${JSON.stringify(message)}`);

    try {
      const channel = await gr.services.channels.channels.get(
        {
          company_id: message.company_id,
          id: message.channel_id,
          workspace_id: message.workspace_id,
        },
        context,
      );

      if (!channel || !Channel.isDirectChannel(channel)) {
        logger.debug(`${this.name} - Not a direct channel`);
        return;
      }

      const memberIds = without(channel.members || [], String(message.sender));
      if (!memberIds.length) {
        logger.debug(`${this.name} - No members to notify. Original array was %o`, channel.members);
      }

      const members = memberIds.map(user_id => {
        return {
          user_id,
          channel_id: channel.id,
          workspace_id: channel.workspace_id,
          company_id: channel.company_id,
        } as ChannelMember;
      });

      await Promise.all(
        members.map(async member => {
          try {
            logger.info(`${this.name} - Adding ${member.user_id} to channel ${message.channel_id}`);
            const memberSaved = await gr.services.channels.members.save(member, {
              channel,
              user: { id: member.user_id },
            });
            logger.info(
              `${this.name} - Member added to channel ${message.channel_id} - ${JSON.stringify(
                memberSaved,
              )}`,
            );
          } catch (err) {
            logger.info(
              { err },
              `${this.name} - Error while adding user ${member.user_id} to direct channel ${member.channel_id}`,
            );
          }
        }),
      );
    } catch (err) {
      logger.error(
        { err },
        `${this.name} - Error while processing direct channel members for message ${message.thread_id}/${message.id} in channel ${message.channel_id}`,
      );
    }
  }
}
