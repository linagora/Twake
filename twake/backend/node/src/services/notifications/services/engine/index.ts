import { Initializable } from "../../../../core/platform/framework";
import { MarkChannelAsReadMessageProcessor } from "./processors/mark-channel-as-read";
import { MarkChannelAsUnreadMessageProcessor } from "./processors/mark-channel-as-unread";
import { NewChannelMessageProcessor } from "./processors/new-channel-message";
import { PushNotificationMessageProcessor } from "./processors/mobile-push-notifications";
import { PushNotificationToUsersMessageProcessor } from "./processors/push-to-users";
import { LeaveChannelMessageProcessor } from "./processors/channel-member-deleted";
import { JoinChannelMessageProcessor } from "./processors/channel-member-created";
import { UpdateChannelMemberMessageProcessor } from "./processors/channel-member-updated";
import gr from "../../../global-resolver";

/**
 * The notification engine is in charge of processing data and delivering user notifications on the right place
 */
export class NotificationEngine implements Initializable {
  async init(): Promise<this> {
    gr.platformServices.pubsub.processor.addHandler(new UpdateChannelMemberMessageProcessor());
    gr.platformServices.pubsub.processor.addHandler(new JoinChannelMessageProcessor());
    gr.platformServices.pubsub.processor.addHandler(new LeaveChannelMessageProcessor());
    gr.platformServices.pubsub.processor.addHandler(new MarkChannelAsReadMessageProcessor());
    gr.platformServices.pubsub.processor.addHandler(new MarkChannelAsUnreadMessageProcessor());
    gr.platformServices.pubsub.processor.addHandler(new NewChannelMessageProcessor());
    gr.platformServices.pubsub.processor.addHandler(new PushNotificationMessageProcessor());
    gr.platformServices.pubsub.processor.addHandler(new PushNotificationToUsersMessageProcessor());

    return this;
  }
}
