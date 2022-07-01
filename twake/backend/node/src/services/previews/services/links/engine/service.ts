import { LinkPreview, LinkPreviewPubsubCallback, LinkPreviewPubsubRequest } from "../../../types";
import { logger, TwakeContext } from "../../../../../core/platform/framework";
import gr from "../../../../global-resolver";
import { PubsubHandler } from "../../../../../core/platform/services/pubsub/api";

export class LinkPreviewProcessor
  implements PubsubHandler<LinkPreviewPubsubRequest, LinkPreviewPubsubCallback>
{
  readonly name = "LinkPreviewProcessor";

  readonly topics = {
    in: "services:preview:links",
    out: "services:preview:links:callback",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  init?(context?: TwakeContext): Promise<this> {
    throw new Error("Method not implemented.");
  }

  /**
   * Checks if the message is valid
   *
   * @param {LinkPreviewPubsubRequest} message - The message to check
   * @returns {Boolean} - true if the message is valid
   */
  validate(message: LinkPreviewPubsubRequest): boolean {
    return !!(message && message.links && message.links.length);
  }

  /**
   * process the links preview generation message
   *
   * @param {LinkPreviewPubsubRequest} message - The message to process
   * @returns {Promise<LinkPreviewPubsubCallback>} - links preview callback
   */
  async process(message: LinkPreviewPubsubRequest): Promise<LinkPreviewPubsubCallback> {
    logger.info(`${this.name} - Processing preview generation for ${message.links.length} links`);

    let res: LinkPreviewPubsubCallback = { previews: [], message: message.message };

    try {
      res = await this.generate(message);
    } catch (err) {
      logger.error(`${this.name} - Can't generate link previews ${err}`);
    }

    logger.info(`${this.name} - Generated ${res.previews.length} link previews`);

    return res;
  }

  /**
   * Generate previews for links
   *
   * @param {LinkPreviewPubsubRequest} message - The message to process
   * @returns {Promise<LinkPreviewPubsubCallback>} - links preview callback
   */
  async generate(message: LinkPreviewPubsubRequest): Promise<LinkPreviewPubsubCallback> {
    let previews: LinkPreview[] = [];
    try {
      previews = await gr.services.preview.links.generatePreviews(message.links);
    } catch (err) {
      logger.error(`${this.name} - Can't generate link previews ${err}`);
      throw Error(`cannot generate link previews: ${err}`);
    }

    return { previews, message: message.message };
  }
}
