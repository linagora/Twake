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
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { Thread } from "../../entities/threads";

export class MessagesEngine implements Initializable {
  private channelViewProcessor: ChannelViewProcessor;
  private channelMarkedViewProcessor: ChannelMarkedViewProcessor;
  private userMarkedViewProcessor: UserMarkedViewProcessor;
  private userInboxViewProcessor: UserInboxViewProcessor;
  private filesViewProcessor: FilesViewProcessor;

  private threadRepository: Repository<Thread>;

  constructor(private database: DatabaseServiceAPI, private service: MessageServiceAPI) {
    this.channelViewProcessor = new ChannelViewProcessor(this.database, this.service);
    this.channelMarkedViewProcessor = new ChannelMarkedViewProcessor(this.database, this.service);
    this.userMarkedViewProcessor = new UserMarkedViewProcessor(this.database, this.service);
    this.userInboxViewProcessor = new UserInboxViewProcessor(this.database, this.service);
    this.filesViewProcessor = new FilesViewProcessor(this.database, this.service);
  }

  async init(): Promise<this> {
    this.threadRepository = await this.database.getRepository<Thread>("threads", Thread);

    await this.channelViewProcessor.init();
    await this.channelMarkedViewProcessor.init();
    await this.userInboxViewProcessor.init();
    await this.userMarkedViewProcessor.init();
    await this.filesViewProcessor.init();

    localEventBus.subscribe("message:saved", async (e: MessageLocalEvent) => {
      const thread = await this.threadRepository.findOne({
        company_id: e.resource.company_id,
        id: e.resource.thread_id,
      });
      this.channelViewProcessor.process(thread, e);
      this.channelMarkedViewProcessor.process(thread, e);
      this.userInboxViewProcessor.process(thread, e);
      this.userMarkedViewProcessor.process(thread, e);
      this.filesViewProcessor.process(thread, e);
    });

    return this;
  }
}
