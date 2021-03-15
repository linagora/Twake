import { Channel, getDefaultChannelInstance } from "../../../entities";
import { Initializable, logger } from "../../../../../core/platform/framework";
import { localEventBus } from "../../../../../core/platform/framework/pubsub";
import { ResourceEventsPayload } from "../../../../../services/types";
import { DefaultChannelService } from "../../../provider";

export default class DefaultChannelListener implements Initializable {
  constructor(private service: DefaultChannelService) {}

  async init(): Promise<this> {
    localEventBus.subscribe<ResourceEventsPayload>(
      "channel:created",
      (event: ResourceEventsPayload) => {
        if (!event.channel) {
          return;
        }

        if (Channel.isDefaultChannel(event.channel)) {
          logger.debug("Default channel has been created", event);
          this.service.create(
            getDefaultChannelInstance({
              channel_id: event.channel.id,
              company_id: event.channel.company_id,
              workspace_id: event.channel.workspace_id,
            }),
          );
        }
      },
    );
    return this;
  }
}
