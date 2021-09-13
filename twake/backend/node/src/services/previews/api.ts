import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";
import { PubsubHandler, PubsubServiceAPI } from "../../core/platform/services/pubsub/api";
import { PreviewProcessService } from "./services/processing/service";

export interface PreviewServiceAPI extends TwakeServiceProvider, Initializable {
  pubsub: PubsubServiceAPI;
  previewProcess: PreviewProcessService;
  /**
   * Get a file entity from its id
   *
   * @param mime
   * @param inputPath
   * @param outputPath
   */
}

/**
 * A notification hander is in charge of processing a notification from the pubsub layer and then optionally produces something to be consumed by another handler somewhere in the platform.
 */
export interface PreviewPubsubHandler<InputMessage, OutputMessage>
  extends PubsubHandler<InputMessage, OutputMessage> {
  service: PreviewServiceAPI;
}
