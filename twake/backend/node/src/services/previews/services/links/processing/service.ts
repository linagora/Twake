import { LinkPreview, LinkPreviewMessageQueueRequest } from "../../../types";
import { generateLinkPreview } from "./link";
import { checkUrlContents } from "../../../utils";
import { generateImageUrlPreview } from "./image";
import {
  Initializable,
  logger,
  TwakeServiceProvider,
} from "../../../../../core/platform/framework";

export class LinkPreviewProcessService implements TwakeServiceProvider, Initializable {
  name: "LinkPreviewProcessService";
  version: "1";

  async init(): Promise<this> {
    return this;
  }

  /**
   * Generate previews for links
   *
   * @param {LinkPreviewMessageQueueRequest["links"]} links - input urls
   * @returns {Promise<LinkPreview[]>} - The generated url previews
   */
  async generatePreviews(links: LinkPreviewMessageQueueRequest["links"]): Promise<LinkPreview[]> {
    const result: LinkPreview[] = [];

    for (const link of links) {
      try {
        const contentType = await checkUrlContents(link);

        if (!contentType) {
          continue;
        }

        if (contentType.includes("text/html")) {
          result.push(await generateLinkPreview(link));
        }

        if (contentType.startsWith("image")) {
          result.push(await generateImageUrlPreview(link));
        }
      } catch (error) {
        logger.error(`failed to generate link preview: ${error}`);
      }
    }

    return result.filter(
      preview => preview && (preview.title || preview.description || preview.img),
    );
  }
}
