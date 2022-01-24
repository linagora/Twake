import { Initializable } from "../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import ChannelServiceAPI from "../../provider";
import { NewChannelActivityProcessor } from "./new-channel-activity";
import { NewDirectChannelMessageProcessor } from "./new-direct-channel-message";
import { NewUserInWorkspaceJoinDefaultChannelsProcessor } from "./new-user-in-workspace-join-default-channels";
import { NewPendingEmailsInWorkspaceJoinChannelsProcessor } from "./new-pending-emails-in-workspace-join-channels";
import UserServiceAPI from "../../../user/api";
import { NewWorkspaceProcessor } from "./new-workspace";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";

export class PubsubListener implements Initializable {
  constructor(
    private platformServices: PlatformServicesAPI,
    private service: ChannelServiceAPI,
    private pubsub: PubsubServiceAPI,
    private user: UserServiceAPI,
  ) {}

  async init(): Promise<this> {
    const channelActivityProcessor = await new NewChannelActivityProcessor(
      this.platformServices,
      this.service.channels,
      this.user,
    ).init();
    this.pubsub.processor.addHandler(channelActivityProcessor);
    this.pubsub.processor.addHandler(new NewDirectChannelMessageProcessor(this.service));
    this.pubsub.processor.addHandler(
      new NewUserInWorkspaceJoinDefaultChannelsProcessor(this.service),
    );
    this.pubsub.processor.addHandler(
      new NewPendingEmailsInWorkspaceJoinChannelsProcessor(this.service),
    );
    this.pubsub.processor.addHandler(new NewWorkspaceProcessor(this.service));

    return this;
  }
}
