import { Initializable } from "../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import { NotificationServiceAPI } from "../../api";
import { MarkChannelAsReadMessageProcessor } from "./processors/mark-channel-as-read";
import { MarkChannelAsUnreadMessageProcessor } from "./processors/mark-channel-as-unread";
import { NewChannelMessageProcessor } from "./processors/new-channel-message";
import { PushNotificationMessageProcessor } from "./processors/mobile-push-notifications";
import { PushNotificationToUsersMessageProcessor } from "./processors/push-to-users";
import { LeaveChannelMessageProcessor } from "./processors/channel-member-deleted";
import { JoinChannelMessageProcessor } from "./processors/channel-member-created";
import { UpdateChannelMemberMessageProcessor } from "./processors/channel-member-updated";

/**
 * The notification engine is in charge of processing data and delivering user notifications on the right place
 */
export class NotificationEngine implements Initializable {
  constructor(private service: NotificationServiceAPI, private pubsub: PubsubServiceAPI) {}

  async init(): Promise<this> {
    this.pubsub.processor.addHandler(new UpdateChannelMemberMessageProcessor(this.service));
    this.pubsub.processor.addHandler(new JoinChannelMessageProcessor(this.service));
    this.pubsub.processor.addHandler(new LeaveChannelMessageProcessor(this.service));
    this.pubsub.processor.addHandler(new MarkChannelAsReadMessageProcessor(this.service));
    this.pubsub.processor.addHandler(new MarkChannelAsUnreadMessageProcessor(this.service));
    this.pubsub.processor.addHandler(new NewChannelMessageProcessor(this.service));
    this.pubsub.processor.addHandler(new PushNotificationMessageProcessor(this.service));
    this.pubsub.processor.addHandler(
      new PushNotificationToUsersMessageProcessor(this.service, this.pubsub),
    );

    return this;
  }
}
