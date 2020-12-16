import { Initializable } from "../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import { NotificationServiceAPI } from "../../api";
import { NewChannelMessageProcessor } from "./processors/new-channel-message";
import { PushNotificationToUsersMessageProcessor } from "./processors/push-to-users";

/**
 * The notification engine is in charge of processing data and delivering user notifications on the right place
 */
export class NotificationEngine implements Initializable {
  constructor(private service: NotificationServiceAPI, private pubsub: PubsubServiceAPI) {}

  async init(): Promise<this> {
    this.pubsub.processor.addHandler(new NewChannelMessageProcessor(this.service));
    this.pubsub.processor.addHandler(new PushNotificationToUsersMessageProcessor(this.service));

    return this;
  }
}
