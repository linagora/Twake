import { MessageQueueHandler } from "../../../../../../core/platform/services/message-queue/api";
import { ActivityPublishedType } from "../../../../../channels/services/channel/activities/types";
import { ParticipantObject } from "../../../../entities/threads";
import { getInstance } from "../../../../entities/messages";
import { logger } from "../../../../../../core/platform/framework";
import gr from "../../../../../global-resolver";

export class ChannelSystemActivityMessageProcessor
  implements MessageQueueHandler<ActivityPublishedType, void>
{
  readonly topics = {
    in: "channel:activity_message",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  readonly name = "Channel::ChannelSystemActivityMessageProcessor";

  validate(message: ActivityPublishedType): boolean {
    return !!(message && message.channel_id && message.company_id && message.workspace_id);
  }

  async process(event: ActivityPublishedType): Promise<void> {
    logger.info(
      `${this.name} Publish system message to message service in channel ${event.channel_id}`,
    );

    const message = getInstance({
      type: "message",
      subtype: "system",
      context: {
        type: "activity",
        activity: event.activity,
      },
    });

    const participants: Pick<ParticipantObject, "type" | "id" | "workspace_id" | "company_id">[] = [
      {
        type: "channel",
        id: event.channel_id,
        workspace_id: event.workspace_id,
        company_id: event.company_id,
      },
    ];

    gr.services.messages.threads.save(
      {
        id: undefined,
        participants,
      },
      {
        message,
      },
      {
        user: {
          id: null,
          server_request: true,
        },
        company: { id: event.company_id },
      },
    );
  }
}
