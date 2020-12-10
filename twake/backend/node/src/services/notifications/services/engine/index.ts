import { logger, TwakeContext } from "../../../../core/platform/framework";
import { MessageNotification } from "../../../messages/types";
import { NotificationEngineAPI, NotificationServiceAPI } from "../../api";
import { PubsubEngineService } from "./pubsub";

/**
 * The notification engine is in charge of processing data and delivering user notifications on the right place
 */
export class NotificationEngine implements NotificationEngineAPI {
  private pubsub: PubsubEngineService;
  constructor(private service: NotificationServiceAPI) {}

  async init(context: TwakeContext): Promise<this> {
    this.pubsub = new PubsubEngineService(this);

    try {
      await this.pubsub.subscribe(context.getProvider("pubsub"));
    } catch (err) {
      logger.warn({ err }, "Not able to start the message notification engine subscriber");
    }
    return this;
  }

  process(message: MessageNotification): void {
    console.log("Processing notification", message);
  }
}
