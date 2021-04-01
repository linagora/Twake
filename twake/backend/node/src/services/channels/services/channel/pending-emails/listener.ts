import { Initializable, getLogger } from "../../../../../core/platform/framework";
import { localEventBus } from "../../../../../core/platform/framework/pubsub";
import { ResourceEventsPayload } from "../../../../types";
import { ChannelPendingEmailService } from "../../../provider";

const logger = getLogger("channel:guests:listener");

export default class ChannelGuestListener implements Initializable {
  constructor(private service: ChannelPendingEmailService) {}

  async init(): Promise<this> {
    localEventBus.subscribe<ResourceEventsPayload>("guest:created", this.onGuestCreated.bind(this));
    localEventBus.subscribe<ResourceEventsPayload>("guest:updated", this.onGuestUpdated.bind(this));
    localEventBus.subscribe<ResourceEventsPayload>("guest:deleted", this.onGuestDeleted.bind(this));
    return this;
  }

  onGuestCreated({ guest }: ResourceEventsPayload): void {
    logger.debug("Pending email has been created %o", guest);
  }

  onGuestUpdated({ guest }: ResourceEventsPayload): void {
    logger.debug("Pending email has been updated %o", guest);
  }

  onGuestDeleted({ guest }: ResourceEventsPayload): void {
    logger.debug("Pending email has been deleted %o", guest);
  }
}
