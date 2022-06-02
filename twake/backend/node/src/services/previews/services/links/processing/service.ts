import { LinkPreviewServiceAPI, LinkPreview, LinkPreviewPubsubRequest } from "../../../types";
import { generateLinksPreviews } from "./link";

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
    try {
      return await generateLinksPreviews(links);
    } catch (error) {
      throw Error(`cannot process: failed to generate links previews: ${error}`);
    }
  }
}
