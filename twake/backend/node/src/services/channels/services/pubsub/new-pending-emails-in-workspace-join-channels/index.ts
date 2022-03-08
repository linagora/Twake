import { getLogger } from "../../../../../core/platform/framework";
import { PubsubHandler } from "../../../../../core/platform/services/pubsub/api";
import ChannelServiceAPI from "../../../provider";
import { NewUserInWorkspaceNotification } from "../../channel/types";

const NAME = "Channel::NewPendingEmailsInWorkspaceJoinChannelsProcessor";
const logger = getLogger("channel.pubsub.new-pending-emails-in-workspace-join-channels-processor");

/**
 * When a new pending email is added in a workspace, a `workspace:email:added` event is published.
 * In such case, the email must be added to all the channels that he is invited.
 */
export class NewPendingEmailsInWorkspaceJoinChannelsProcessor
  implements PubsubHandler<NewUserInWorkspaceNotification, void>
{
  constructor(readonly service: ChannelServiceAPI) {}

  readonly topics = {
    in: "workspace:member:added",
  };

  readonly options = {
    unique: true,
    ack: true,
    queue: "workspace:user:added:consumer_channel_pending_emails",
  };

  readonly name = NAME;

  validate(message: NewUserInWorkspaceNotification): boolean {
    return !!(message && message.company_id && message.workspace_id && message.user_id);
  }

  async process(message: NewUserInWorkspaceNotification): Promise<void> {
    logger.debug("Processing notification for message %o", message);

    try {
      await this.service.pendingEmails.proccessPendingEmails(message, {
        workspace_id: message.workspace_id,
        company_id: message.company_id,
      });
    } catch (err) {
      logger.error(
        { err },
        `${this.name} - Error while processing message for pending emails %o`,
        message,
      );
    }
  }
}
