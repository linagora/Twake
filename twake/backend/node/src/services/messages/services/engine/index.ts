import { Initializable } from "../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import { MessageServiceAPI } from "../../api";

/**
 * The notification engine is in charge of processing data and delivering user notifications on the right place
 */
export class MessagesEngine implements Initializable {
  constructor(private service: MessageServiceAPI, private pubsub: PubsubServiceAPI) {}

  async init(): Promise<this> {
    //    this.pubsub.processor.addHandler(new UpdateChannelMemberMessageProcessor(this.service));

    return this;
  }
}
