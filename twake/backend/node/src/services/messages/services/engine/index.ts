import { localEventBus } from "../../../../core/platform/framework/pubsub";
import { Initializable } from "../../../../core/platform/framework";
import { MessageServiceAPI } from "../../api";
import { MessageLocalEvent } from "../../types";
import { ChannelViewProcessor } from "./processors/channel-view";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { ChannelMarkedViewProcessor } from "./processors/channel-marked";
import { UserMarkedViewProcessor } from "./processors/user-marked";
import { UserInboxViewProcessor } from "./processors/user-inbox";
import { FilesViewProcessor } from "./processors/files";

export class MessagesEngine implements Initializable {
  private channelViewProcessor: ChannelViewProcessor;
  private channelMarkedViewProcessor: ChannelMarkedViewProcessor;
  private userMarkedViewProcessor: UserMarkedViewProcessor;
  private userInboxViewProcessor: UserInboxViewProcessor;
  private filesViewProcessor: FilesViewProcessor;

  constructor(private database: DatabaseServiceAPI, private service: MessageServiceAPI) {
    this.channelViewProcessor = new ChannelViewProcessor(this.database, this.service);
    this.channelMarkedViewProcessor = new ChannelMarkedViewProcessor(this.database, this.service);
    this.userMarkedViewProcessor = new UserMarkedViewProcessor(this.database, this.service);
    this.userInboxViewProcessor = new UserInboxViewProcessor(this.database, this.service);
    this.filesViewProcessor = new FilesViewProcessor(this.database, this.service);
  }

  async init(): Promise<this> {
    localEventBus.subscribe("message:saved", (e: MessageLocalEvent) =>
      this.channelViewProcessor.process(e),
    );
    localEventBus.subscribe("message:saved", (e: MessageLocalEvent) =>
      this.channelMarkedViewProcessor.process(e),
    );
    localEventBus.subscribe("message:saved", (e: MessageLocalEvent) =>
      this.userInboxViewProcessor.process(e),
    );
    localEventBus.subscribe("message:saved", (e: MessageLocalEvent) =>
      this.userMarkedViewProcessor.process(e),
    );
    localEventBus.subscribe("message:saved", (e: MessageLocalEvent) =>
      this.filesViewProcessor.process(e),
    );
    return this;
  }
}
