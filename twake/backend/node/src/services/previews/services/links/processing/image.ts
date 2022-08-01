import { LinkPreview } from "../../../types";
import { logger } from "../../../../../core/platform/framework";
import imageProbe from "probe-image-size";
import { getUrlFavicon, getDomain } from "../../../utils";

/**
 * Generate a preview for a given image url.
 *
 * @param {String} url - the input url
 * @returns {Promise<LinkPreview>} - resolves when the preview is generated
 */
export const generateImageUrlPreview = async (url: string): Promise<LinkPreview | null> => {
  try {
    const favicon = (await getUrlFavicon(getWebsiteUrl(url))) || null;
    const domain = getDomain(url);
    const title = url.split("/").pop();
    const { height: img_height, width: img_width } = await imageProbe(url);

    return {
      title,
      domain,
      favicon,
      url,
      img_height,
      img_width,
      description: null,
      img: url,
    };
  } catch (error) {
    logger.error(`failed to generate image url preview: ${error}`);
  }
};

const getWebsiteUrl = (url: string) => {
  const urlObj = new URL(url);
  return `${urlObj.protocol}//${urlObj.hostname}`;
};
