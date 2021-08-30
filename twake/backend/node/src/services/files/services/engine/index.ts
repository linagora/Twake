import { Initializable } from "../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import { FileServiceAPI } from "../../api";
import { PreviewFinishedProcessor } from "./filePreviewProcessor";
import { FileProcessor } from "./fileProcessor";

/**
 * The notification engine is in charge of processing data and delivering user notifications on the right place
 */
export class FileEngine implements Initializable {
  constructor(private service: FileServiceAPI, private pubsub: PubsubServiceAPI) {}

  async init(): Promise<this> {
    this.pubsub.processor.addHandler(new FileProcessor(this.service, this.pubsub));
    this.pubsub.processor.addHandler(new PreviewFinishedProcessor(this.service, this.pubsub));

    return this;
  }
}
