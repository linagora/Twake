import { getLogger } from "../../../../../core/platform/framework";
import { PubsubHandler } from "../../../../../core/platform/services/pubsub/api";
import ChannelServiceAPI from "../../../provider";
import { NewUserInWorkspaceNotification } from "../../channel/types";

const NAME = "Channel::NewUserInWorkspaceJoinDefaultChannelsProcessor";
const logger = getLogger("channel.pubsub.new-user-in-workspace-join-default-channels-processor");

/**
 * When a new user is added in a workspace, a `workspace:user:added` event is published.
 * In such case, the user must be added to all the default channels of the workspace.
 */
export class NewUserInWorkspaceJoinDefaultChannelsProcessor
  implements PubsubHandler<NewUserInWorkspaceNotification, void> {
  constructor(readonly service: ChannelServiceAPI) {}

  readonly topics = {
    in: "workspace:member:added",
  };

  readonly options = {
    unique: true,
    ack: true,
    queue: "workspace:user:added:consumer_default_channels",
  };

  readonly name = NAME;

  validate(message: NewUserInWorkspaceNotification): boolean {
    return !!(message && message.company_id && message.workspace_id && message.user_id);
  }

  async process(message: NewUserInWorkspaceNotification): Promise<void> {
    logger.debug("Processing notification for message %o", message);

    try {
      const channelMembers = await this.service.channels.addUserToDefaultChannels(
        { id: message.user_id },
        {
          company_id: message.company_id,
          workspace_id: message.workspace_id,
        },
      );

      logger.debug(
        "User %s has been added as member to default channels %o",
        message.user_id,
        (channelMembers || []).map(c => c.channel_id),
      );
    } catch (err) {
      logger.error(
        { err },
        `${this.name} - Error while processing message for default channels %o`,
        message,
      );
    }
  }
}
