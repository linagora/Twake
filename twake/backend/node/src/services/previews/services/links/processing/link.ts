import { parser } from "html-metadata-parser";
import getFavicons from "get-website-favicon";
import { LinkPreview } from "../../../types";
import { logger } from "../../../../../core/platform/framework";
import imageProbe from "probe-image-size";

type HtmlImage = {
  src: string;
};

/**
 * Generate a thumbnail for a given url.
 *
 * @param {String[]} urls - the input urls
 * @returns {Promise<LinkPreview[]>} - resolves when the thumbnails are generated
 */
export async function generateLinksPreviews(urls: string[]): Promise<LinkPreview[]> {
  const output: LinkPreview[] = [];

  for (const url of urls) {
    try {
      output.push(await getUrlInformation(url));
    } catch (error) {
      logger.error(`failed to generate link preview: ${error}`);
    }
  }

  return output;
}

/**
 * Get domain from a given url.
 *
 * @param {String} url - the input url
 * @returns {String} - resolves when the domain is retrieved
 */
const getDomain = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, "");
  } catch (error) {
    throw Error(`failed to get domain: ${error}`);
  }
};

/**
 * get url information
 *
 * @param {String} url - the input url
 * @returns {Promise<LinkPreview>} - resolves when the information is retrieved
 */
const getUrlInformation = async (url: string): Promise<LinkPreview> => {
  try {
    const parsedPage = await parser(url);
    const title = parsedPage.og?.title || parsedPage.meta?.title || null;
    const description = parsedPage.og?.description || parsedPage.meta?.description || null;
    let img = parsedPage.og?.image || parsedPage.meta?.image || parsedPage.images?.[0] || null;
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

/**
 * get url favicon
 *
 * @param {String} url - the input url
 * @returns {Promise<String | null >} - resolves when the favicon is retrieved
 */
const getUrlFavicon = async (url: string): Promise<string | null> => {
  try {
    const result = await getFavicons(url);
    if (!result.icons || !result.icons.length) {
      return;
    }

    return result.icons[0].src;
  } catch (error) {
    logger.error(`failed to get url favicon: ${error}`);
  }
};
