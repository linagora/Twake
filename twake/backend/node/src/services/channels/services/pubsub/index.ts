import { Initializable } from "../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import ChannelServiceAPI from "../../provider";
import { NewChannelActivityProcessor } from "./new-channel-activity";
import { NewDirectChannelMessageProcessor } from "./new-direct-channel-message";
import { NewUserInWorkspaceJoinDefaultChannelsProcessor } from "./new-user-in-workspace-join-default-channels";
import { NewPendingEmailsInWorkspaceJoinChannelsProcessor } from "./new-pending-emails-in-workspace-join-channels";
import UserServiceAPI from "../../../user/api";

export class PubsubListener implements Initializable {
  constructor(
    private service: ChannelServiceAPI,
    private pubsub: PubsubServiceAPI,
    private user: UserServiceAPI,
  ) {}

  async init(): Promise<this> {
    this.pubsub.processor.addHandler(
      new NewChannelActivityProcessor(this.service.channels, this.user),
    );
    this.pubsub.processor.addHandler(new NewDirectChannelMessageProcessor(this.service));
    this.pubsub.processor.addHandler(
      new NewUserInWorkspaceJoinDefaultChannelsProcessor(this.service),
    );
    this.pubsub.processor.addHandler(
      new NewPendingEmailsInWorkspaceJoinChannelsProcessor(this.service),
    );

    return this;
  }
}
