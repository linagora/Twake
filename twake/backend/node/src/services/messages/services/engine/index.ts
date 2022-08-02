import { localEventBus } from "../../../../core/platform/framework/event-bus";
import { Initializable } from "../../../../core/platform/framework";
import { MessageFileDownloadEvent, MessageLocalEvent } from "../../types";
import { ChannelViewProcessor } from "./processors/channel-view";
import { ChannelMarkedViewProcessor } from "./processors/channel-marked";
import { UserMarkedViewProcessor } from "./processors/user-marked";
import { UserInboxViewProcessor } from "./processors/user-inbox";
import { FilesViewProcessor } from "./processors/files";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { Thread } from "../../entities/threads";
import { ChannelSystemActivityMessageProcessor } from "./processors/system-activity-message";
import { MessageToNotificationsProcessor } from "./processors/message-to-notifications";
import { ResourceEventsPayload } from "../../../../utils/types";
import _ from "lodash";
import { StatisticsMessageProcessor } from "../../../statistics/pubsub/messages";
import { MessageToHooksProcessor } from "./processors/message-to-hooks";
import gr from "../../../global-resolver";
import { MessageLinksPreviewFinishedProcessor } from "./processors/links";
import { Message } from "../../entities/messages";
import { ExecutionContext } from "../../../../core/platform/framework/api/crud-service";

export class MessagesEngine implements Initializable {
  private channelViewProcessor: ChannelViewProcessor;
  private channelMarkedViewProcessor: ChannelMarkedViewProcessor;
  private userMarkedViewProcessor: UserMarkedViewProcessor;
  private userInboxViewProcessor: UserInboxViewProcessor;
  private filesViewProcessor: FilesViewProcessor;
  private messageToNotifications: MessageToNotificationsProcessor;
  private messageToHooks: MessageToHooksProcessor;

  private threadRepository: Repository<Thread>;
  private messageRepository: Repository<Message>;

  constructor() {
    this.channelViewProcessor = new ChannelViewProcessor();
    this.channelMarkedViewProcessor = new ChannelMarkedViewProcessor();
    this.userMarkedViewProcessor = new UserMarkedViewProcessor();
    this.userInboxViewProcessor = new UserInboxViewProcessor();
    this.filesViewProcessor = new FilesViewProcessor();
    this.messageToNotifications = new MessageToNotificationsProcessor();
    this.messageToHooks = new MessageToHooksProcessor();
  }

  async dispatchMessage(e: MessageLocalEvent, context?: ExecutionContext) {
    const thread = await this.threadRepository.findOne(
      {
        id: e.resource.thread_id,
      },
      {},
      context,
    );

    if (e.resource.ephemeral) {
      await this.channelViewProcessor.process(thread || null, e);
      return;
    }

    await this.channelViewProcessor.process(thread, e);
    await this.channelMarkedViewProcessor.process(thread, e);
    await this.userInboxViewProcessor.process(thread, e);
    await this.userMarkedViewProcessor.process(thread, e);
    await this.filesViewProcessor.process(thread, e);
    await this.messageToNotifications.process(thread, e);
    await this.messageToHooks.process(thread, e);

    if (e.created) {
      for (const workspaceId of _.uniq(
        thread.participants.filter(p => p.type == "channel").map(p => p.workspace_id),
      )) {
        localEventBus.publish<ResourceEventsPayload>("channel:message_sent", {
          message: {
            thread_id: e.resource.thread_id,
            sender: e.resource.user_id,
            workspace_id: workspaceId,
          },
          user: e.context.user,
        });
      }
    }
  }

  async init(): Promise<this> {
    this.threadRepository = await gr.database.getRepository<Thread>("threads", Thread);
    this.messageRepository = await gr.database.getRepository<Message>("messages", Message);

    await this.channelViewProcessor.init();
    await this.channelMarkedViewProcessor.init();
    await this.userInboxViewProcessor.init();
    await this.userMarkedViewProcessor.init();
    await this.filesViewProcessor.init();

    gr.platformServices.messageQueue.processor.addHandler(
      new ChannelSystemActivityMessageProcessor(),
    );
    gr.platformServices.messageQueue.processor.addHandler(new StatisticsMessageProcessor());
    gr.platformServices.messageQueue.processor.addHandler(
      new MessageLinksPreviewFinishedProcessor(this.messageRepository, this.threadRepository),
    );

    localEventBus.subscribe("message:saved", async (e: MessageLocalEvent) => {
      this.dispatchMessage(e);
    });

    localEventBus.subscribe("message:download", async (e: MessageFileDownloadEvent) => {
      if (e.user?.id) {
        await this.filesViewProcessor.processDownloaded(e.user?.id, e.operation);
      }
    });

    return this;
  }
}
