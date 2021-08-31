import StorageAPI from "../../../../core/platform/services/storage/provider";
import { Initializable } from "../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import { PreviewServiceAPI } from "../../api";
import { PreviewProcessor } from "./service";

/**
 * The notification engine is in charge of processing data and delivering user notifications on the right place
 */
export class PreviewEngine implements Initializable {
  constructor(
    private service: PreviewServiceAPI,
    private pubsub: PubsubServiceAPI,
    private storage: StorageAPI,
  ) {}

  async init(): Promise<this> {
    this.pubsub.processor.addHandler(new PreviewProcessor(this.service, this.pubsub, this.storage));

    return this;
  }
}
