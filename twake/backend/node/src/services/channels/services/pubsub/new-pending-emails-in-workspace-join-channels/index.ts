import { getLogger } from "../../../../../core/platform/framework";
import { PubsubHandler } from "../../../../../core/platform/services/pubsub/api";
import ChannelServiceAPI, { ChannelPendingEmailService } from "../../../provider";

type NewEmailInWorkspaceNotification = {
  email: string;
  company_id: string;
  channel_id: string;
  workspace_id: string;
};

const NAME = "Channel::NewPendingEmailsInWorkspaceJoinChannelsProcessor";
const logger = getLogger("channel.pubsub.new-pending-emails-in-workspace-join-channels-processor");

/**
 * When a new pending email is added in a workspace, a `workspace:email:added` event is published.
 * In such case, the email must be added to all the channels that he is invited.
 */
export class NewPendingEmailsInWorkspaceJoinChannelsProcessor
  implements PubsubHandler<NewEmailInWorkspaceNotification, void> {
  constructor(readonly service: ChannelServiceAPI) {}

  readonly topics = {
    in: "workspace:user:added",
  };

  readonly options = {
    unique: true,
    ack: true,
    queue: "workspace:user:added:consumer_channel_pending_emails",
  };

  readonly name = NAME;

  validate(message: NewEmailInWorkspaceNotification): boolean {
    return !!(message && message.company_id && message.workspace_id && message.email);
  }

  async process(message: NewEmailInWorkspaceNotification): Promise<void> {
    logger.debug("Processing notification for message %o", message);

    try {
      const pendingEmailsInWorkspace = await this.service.pendingEmails.findPendingEmails(message);

      console.log("pendingEmailsInWorkspace", pendingEmailsInWorkspace);
      /*

      user id ici 
      pas email pending

      logger.debug(
        "Email %s has been added as member to all the channels that he is invited %o",
        message.email,
        (channelMembers || []).map(c => c.channel_id),
      );*/
    } catch (err) {
      logger.error(
        { err },
        `${this.name} - Error while processing message for pending emails %o`,
        message,
      );
    }
  }
}
