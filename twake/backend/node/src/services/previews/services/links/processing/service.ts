import { LinkPreviewServiceAPI, LinkPreview, LinkPreviewPubsubRequest } from "../../../types";
import { generateLinkPreview } from "./link";
import { checkUrlContents } from "../../../utils";
import { generateImageUrlPreview } from "./image";
import { logger } from "../../../../../core/platform/framework";

export class LinkPreviewProcessService implements LinkPreviewServiceAPI {
  name: "LinkPreviewProcessService";
  version: "1";

  async init(): Promise<this> {
    return this;
  }

  /**
   * Generate previews for links
   *
   * @param {LinkPreviewPubsubRequest["links"]} links - input urls
   * @returns {Promise<LinkPreview[]>} - The generated url previews
   */
  async generatePreviews(links: LinkPreviewPubsubRequest["links"]): Promise<LinkPreview[]> {
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

    return result.filter(Boolean);
  }
}
