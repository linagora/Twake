import { localEventBus } from "../../../../core/platform/framework/pubsub";
import { Initializable } from "../../../../core/platform/framework";
import { MessageServiceAPI } from "../../api";
import { MessageLocalEvent } from "../../types";
import { ChannelViewProcessor } from "./processors/channel-view";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
export class MessagesEngine implements Initializable {
  private channelViewProcessor: ChannelViewProcessor;

  constructor(private database: DatabaseServiceAPI, private service: MessageServiceAPI) {
    this.channelViewProcessor = new ChannelViewProcessor(this.database, this.service);
  }

  async init(): Promise<this> {
    localEventBus.subscribe("message:saved", (e: MessageLocalEvent) =>
      this.channelViewProcessor.process(e),
    );
    return this;
  }
}
