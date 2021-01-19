import { Initializable } from "../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import ChannelServiceAPI from "../../provider";
import { NewDirectChannelMessageProcessor } from "./new-direct-channel-message";

export class PubsubListener implements Initializable {
  constructor(private service: ChannelServiceAPI, private pubsub: PubsubServiceAPI) {}

  async init(): Promise<this> {
    this.pubsub.processor.addHandler(new NewDirectChannelMessageProcessor(this.service));

    return this;
  }
}
