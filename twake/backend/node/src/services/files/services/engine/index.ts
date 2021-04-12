import { Initializable } from "../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import { FileServiceAPI } from "../../api";

/**
 * The notification engine is in charge of processing data and delivering user notifications on the right place
 */
export class MessagesEngine implements Initializable {
  constructor(private service: FileServiceAPI, private pubsub: PubsubServiceAPI) {}

  async init(): Promise<this> {
    return this;
  }
}
