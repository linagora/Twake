import { logger, TwakeContext } from "../../../../../core/platform/framework";
import { PreviewClearPubsubRequest, PreviewPubsubCallback } from "../../../types";
import gr from "../../../../global-resolver";
import { PubsubHandler } from "../../../../../core/platform/services/pubsub/api";

/**
 * Clear thumbnails when the delete task is called
 */
export class ClearProcessor
  implements PubsubHandler<PreviewClearPubsubRequest, PreviewPubsubCallback>
{
  readonly name = "ClearProcessor";

  readonly topics = {
    in: "services:preview:clear",
    out: "services:preview:callback",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  init?(context?: TwakeContext): Promise<this> {
    throw new Error("Method not implemented.");
  }

  validate(message: PreviewClearPubsubRequest): boolean {
    return !!(message && message.document);
  }

  async process(message: PreviewClearPubsubRequest): Promise<PreviewPubsubCallback> {
    logger.info(`${this.name} - Processing preview generation ${message.document.id}`);

    if (!this.validate(message)) {
      throw new Error("Missing required fields");
    }

    for (let i = 0; i < message.document.thumbnails_number; i++) {
      await gr.platformServices.storage.remove(
        `${message.document.path.replace(/\/$/, "")}/${i}.png`,
      );
    }

    return { document: message.document, thumbnails: [] };
  }
}
