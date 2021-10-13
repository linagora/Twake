import { localEventBus } from "../../../../core/platform/framework/pubsub";
import { Initializable, logger } from "../../../../core/platform/framework";
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
import { ChannelSystemActivityMessageProcessor } from "./processors/system-activity-message";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import { MessageToNotificationsProcessor } from "./processors/message-to-notifications";
import { ResourceEventsPayload } from "../../../../utils/types";
import UserServiceAPI from "../../../user/api";
import ChannelServiceAPI from "../../../channels/provider";
import _ from "lodash";
import { StatisticsMessageProcessor } from "../../../statistics/pubsub/messages";
import { StatisticsAPI } from "../../../statistics/types";

export class MessagesEngine implements Initializable {
  private channelViewProcessor: ChannelViewProcessor;
  private channelMarkedViewProcessor: ChannelMarkedViewProcessor;
  private userMarkedViewProcessor: UserMarkedViewProcessor;
  private userInboxViewProcessor: UserInboxViewProcessor;
  private filesViewProcessor: FilesViewProcessor;
  private messageToNotifications: MessageToNotificationsProcessor;

  private threadRepository: Repository<Thread>;

  constructor(
    private database: DatabaseServiceAPI,
    private pubsub: PubsubServiceAPI,
    private user: UserServiceAPI,
    private channel: ChannelServiceAPI,
    private service: MessageServiceAPI,
    private statistics: StatisticsAPI,
  ) {
    this.channelViewProcessor = new ChannelViewProcessor(this.database, this.service);
    this.channelMarkedViewProcessor = new ChannelMarkedViewProcessor(this.database, this.service);
    this.userMarkedViewProcessor = new UserMarkedViewProcessor(this.database, this.service);
    this.userInboxViewProcessor = new UserInboxViewProcessor(this.database, this.service);
    this.filesViewProcessor = new FilesViewProcessor(this.database, this.service);
    this.messageToNotifications = new MessageToNotificationsProcessor(
      this.database,
      this.pubsub,
      this.user,
      this.channel,
      this.service,
    );
  }

  async init(): Promise<this> {
    this.threadRepository = await this.database.getRepository<Thread>("threads", Thread);

    await this.channelViewProcessor.init();
    await this.channelMarkedViewProcessor.init();
    await this.userInboxViewProcessor.init();
    await this.userMarkedViewProcessor.init();
    await this.filesViewProcessor.init();
    this.pubsub.processor.addHandler(new ChannelSystemActivityMessageProcessor(this.service));
    this.pubsub.processor.addHandler(new StatisticsMessageProcessor(this.statistics));

    localEventBus.subscribe("message:saved", async (e: MessageLocalEvent) => {
      const thread = await this.threadRepository.findOne({
        id: e.resource.thread_id,
      });

      this.channelViewProcessor.process(thread, e);
      this.channelMarkedViewProcessor.process(thread, e);
      this.userInboxViewProcessor.process(thread, e);
      this.userMarkedViewProcessor.process(thread, e);
      this.filesViewProcessor.process(thread, e);
      this.messageToNotifications.process(thread, e);

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
    });

    return this;
  }
}
