import { getLogger } from "../../../../../core/platform/framework";
import { PubsubHandler } from "../../../../../core/platform/services/pubsub/api";
import { ChannelActivityNotification } from "../../../types";
import { ChannelService } from "../../../provider";
import UserServiceAPI from "../../../../user/api";
import { CounterProvider } from "../../../../../core/platform/services/counter/provider";
import {
  ChannelCounterEntity,
  ChannelUserCounterType,
  TYPE as ChannelCounterEntityType,
} from "../../../entities/channel-counters";
import { PlatformServicesAPI } from "../../../../../core/platform/services/platform-services";

const logger = getLogger("channel.pubsub.new-channel-activity");
export class NewChannelActivityProcessor
  implements PubsubHandler<ChannelActivityNotification, void>
{
  private channelCounter: CounterProvider<ChannelCounterEntity>;

  constructor(
    readonly platformServices: PlatformServicesAPI,
    readonly service: ChannelService,
    private user: UserServiceAPI,
  ) {}

  async init() {
    const channelCountersRepository =
      await this.platformServices.database.getRepository<ChannelCounterEntity>(
        ChannelCounterEntityType,
        ChannelCounterEntity,
      );
    this.channelCounter = await this.platformServices.counter.getCounter<ChannelCounterEntity>(
      channelCountersRepository,
    );
    return this;
  }

  readonly topics = {
    in: "channel:activity",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  readonly name = "NewChannelActivityProcessor";

  validate(message: ChannelActivityNotification): boolean {
    return !!(message && message.channel_id && message.company_id && message.workspace_id);
  }

  async process(message: ChannelActivityNotification): Promise<void> {
    logger.info(`${this.name} - Processing new activity in channel ${message.channel_id}`);

    await this.channelCounter.increase(
      {
        id: message.channel_id,
        company_id: message.company_id,
        workspace_id: message.workspace_id,
        counter_type: ChannelUserCounterType.MESSAGES,
      },
      1,
    );

    try {
      this.service.updateLastActivity(
        {
          date: message.date,
          channel: {
            id: message.channel_id,
            workspace_id: message.workspace_id,
            company_id: message.company_id,
          },
          message: {
            date: message.date,
            sender: message.sender,
            sender_name: message.sender_name,
            title: message.title,
            text: message.body,
          },
        },
        {
          workspace: {
            workspace_id: message.workspace_id,
            company_id: message.company_id,
          },
          user: {
            id: message.sender,
          },
        },
      );
    } catch (err) {
      logger.error(
        { err },
        `${this.name} - Error while applying channel new activity in channel ${message?.channel_id}`,
      );
    }
  }
}
