import { getChannelGuestInstance } from "../../../entities";
import { Initializable, getLogger } from "../../../../../core/platform/framework";
import { localEventBus } from "../../../../../core/platform/framework/pubsub";
import { ResourceEventsPayload } from "../../../../types";
import { ChannelGuestService } from "../../../provider";

const logger = getLogger("channel:guests:listener");

export default class ChannelGuestListener implements Initializable {
  constructor(private service: ChannelGuestService) {}

  async init(): Promise<this> {
    return this;
  }
}
