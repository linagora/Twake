import { Initializable } from "../../../../core/platform/framework";
import { NewChannelActivityProcessor } from "./new-channel-activity";
import { NewDirectChannelMessageProcessor } from "./new-direct-channel-message";
import { NewUserInWorkspaceJoinDefaultChannelsProcessor } from "./new-user-in-workspace-join-default-channels";
import { NewPendingEmailsInWorkspaceJoinChannelsProcessor } from "./new-pending-emails-in-workspace-join-channels";
import { NewWorkspaceProcessor } from "./new-workspace";
import gr from "../../../global-resolver";

export class ChannelsPubsubListener implements Initializable {
  async init(): Promise<this> {
    const channelActivityProcessor = await new NewChannelActivityProcessor().init();
    gr.platformServices.pubsub.processor.addHandler(channelActivityProcessor);
    gr.platformServices.pubsub.processor.addHandler(new NewDirectChannelMessageProcessor());
    gr.platformServices.pubsub.processor.addHandler(
      new NewUserInWorkspaceJoinDefaultChannelsProcessor(),
    );
    gr.platformServices.pubsub.processor.addHandler(
      new NewPendingEmailsInWorkspaceJoinChannelsProcessor(),
    );
    gr.platformServices.pubsub.processor.addHandler(new NewWorkspaceProcessor());

    return this;
  }
}
