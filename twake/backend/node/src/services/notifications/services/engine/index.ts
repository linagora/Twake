import { Initializable } from "../../../../core/platform/framework";
import { MessageNotification } from "../../../messages/types";
import { NotificationServiceAPI } from "../../api";
import { PubsubEngineService } from "./pubsub";

/**
 * The notification engine is in charge of processing data and delivering user notifications on the right place
 */
export class NotificationEngine implements Initializable {
  private pubsub: PubsubEngineService;
  constructor(private service: NotificationServiceAPI) {}

  async init(): Promise<this> {
    this.pubsub = new PubsubEngineService(this);
    return this;
  }

  process(message: MessageNotification): void {
    console.log("Processing notification", message);
  }
}
