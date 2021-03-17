import { DefaultChannel } from "../../../entities";
import { logger } from "../../../../../core/platform/framework";
import { PubsubHandler } from "../../../../../core/platform/services/pubsub/api";
import ChannelServiceAPI from "../../../provider";

type NewUserInWorkspaceNotification = {
  user: string;
  company_id: string;
  workspace_id: string;
};

/**
 * When a new user is added in a workspace, a `workspace:user:added` event is published.
 * In such case, the user must be added to all the default channels of the workspace.
 */
export class NewUserInWorkspaceJoinDefaultChannelsProcessor
  implements PubsubHandler<NewUserInWorkspaceNotification, void> {
  constructor(readonly service: ChannelServiceAPI) {}

  readonly topics = {
    in: "workspace:user:added",
  };

  readonly name = "Channel::NewUserInWorkspaceJoinDefaultChannelsProcessor";

  validate(message: NewUserInWorkspaceNotification): boolean {
    return !!(message && message.company_id && message.workspace_id && message.user);
  }

  async process(message: NewUserInWorkspaceNotification): Promise<void> {
    logger.info(`${this.name} - Processing notification for message %o`, message);

    try {
      // TODO: Get all the default channels (observable, not paginated)
      const channels: DefaultChannel[] = await this.service.channels.getDefaultChannels({
        company_id: message.company_id,
        workspace_id: message.workspace_id,
      });

      if (!channels || !channels.length) {
        logger.debug(`${this.name} - No default channels in workspace %o`, message);
        return;
      }

      logger.info(
        `${this.name} - Adding user ${message.user} to channels ${JSON.stringify(channels)}`,
      );
      await this.service.members.addUserToChannels({ id: message.user }, channels);
    } catch (err) {
      logger.error(
        { err },
        `${this.name} - Error while processing message for default channels %o`,
        message,
      );
    }
  }
}
