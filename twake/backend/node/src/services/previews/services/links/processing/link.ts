import { parser } from "html-metadata-parser";
import { LinkPreview } from "../../../types";
import { logger } from "../../../../../core/platform/framework";
import imageProbe from "probe-image-size";
import { getUrlFavicon, getDomain, TIMEOUT, MAX_SIZE } from "../../../utils";
import ua from "random-useragent";

type HtmlImage = {
  src: string;
};

/**
 * Generate a thumbnail for a given url.
 *
 * @param {String[]} urls - the input urls
 * @returns {Promise<LinkPreview>} - resolves when the preview is generated
 */
export async function generateLinkPreview(url: string): Promise<LinkPreview> {
  try {
    return await getUrlInformation(url);
  } catch (error) {
    logger.error(`failed to generate link preview: ${error}`);
  }
}

/**
 * get url information
 *
 * @param {String} url - the input url
 * @returns {Promise<LinkPreview>} - resolves when the information is retrieved
 */
const getUrlInformation = async (url: string): Promise<LinkPreview> => {
  try {
    const parsedPage = await parser(url, {
      timeout: TIMEOUT,
      maxContentLength: MAX_SIZE,
      headers: {
        "User-Agent": ua.getRandom(),
      },
    });
    const title = parsedPage.og?.title || parsedPage.meta?.title || null;
    const description = parsedPage.og?.description || parsedPage.meta?.description || null;
    let img = parsedPage.og?.image || parsedPage.meta?.image || parsedPage.images?.[0] || null;

    if (!title && !description && !img) {
      throw new Error("not enough information to generate link preview");
    }

    const favicon = (await getUrlFavicon(url)) || null;
    const domain = getDomain(url);
    let img_height: number | null = null,
      img_width: number | null = null;

    if (img) {
      if (typeof img === "object") {
        img = (img as HtmlImage).src;
      }

      const dimensions = await imageProbe(img);
      img_height = dimensions.height;
      img_width = dimensions.width;
    }

    return {
      title,
      domain,
      description,
      favicon,
      img,
      img_height,
      img_width,
      url,
    };
  } catch (error) {
    throw Error(`failed to get url information: ${error}`);
  }
};
