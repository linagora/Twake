import { Initializable } from "../../../../../core/platform/framework";
import { LinkPreviewProcessor } from "./service";
import gr from "../../../../global-resolver";

export class LinkPreviewEngine implements Initializable {
  async init(): Promise<this> {
    gr.platformServices.messageQueue.processor.addHandler(new LinkPreviewProcessor());

    return this;
  }
}
