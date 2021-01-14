import { Initializable } from "../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import ChannelServiceAPI from "../../provider";
import { NewChannelMessageProcessor } from "./new-channel-message";

export class PubsubListener implements Initializable {
  constructor(private service: ChannelServiceAPI, private pubsub: PubsubServiceAPI) {}

  async init(): Promise<this> {
    this.pubsub.processor.addHandler(new NewChannelMessageProcessor(this.service));

    return this;
  }
}
