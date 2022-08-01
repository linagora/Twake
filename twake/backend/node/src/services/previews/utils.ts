import { v4 as uuidv4 } from "uuid";
import mimes from "./services/files/processing/mime";
import fs, { existsSync, promises as fsPromise } from "fs";
import getFavicons from "get-website-favicon";
import { logger } from "../../core/platform/framework";
import axios from "axios";

export const TIMEOUT = 5 * 1000;
export const MAX_SIZE = 5 * 1024 * 1024;

const { unlink } = fsPromise;

export function getTmpFile(): string {
  const targetDir = "/tmp/";
  fs.mkdirSync(targetDir, { recursive: true });
  return `${targetDir}${uuidv4()}`;
}

export function isFileType(fileMime: string, fileName: string, requiredExtensions: string[]): any {
  const extension = fileName.split(".").pop();
  const secondaryExtensions = Object.keys(mimes).filter(k => mimes[k] === fileMime);
  const fileExtensions = [extension, ...secondaryExtensions];
  return fileExtensions.some(e => requiredExtensions.includes(e));
}

export async function cleanFiles(paths: string[]) {
  for (const path of paths) {
    if (existsSync(path)) await unlink(path);
  }
}

/**
 * get url favicon
 *
 * @param {String} url - the input url
 * @returns {Promise<String | null >} - resolves when the favicon is retrieved
 */
export const getUrlFavicon = async (url: string): Promise<string | null> => {
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

/**
 * Get domain from a given url.
 *
 * @param {String} url - the input url
 * @returns {String} - resolves when the domain is retrieved
 */
export const getDomain = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, "");
  } catch (error) {
    throw Error(`failed to get domain: ${error}`);
  }
};

/**
 * Get url content type headers
 *
 * @param {string} url - the input url
 * @returns {Promise<string | void>} - the request headers
 */
export const checkUrlContents = async (url: string): Promise<string | void> => {
  try {
    const response = await axios(url, {
      maxContentLength: MAX_SIZE,
      timeout: TIMEOUT,
    });

    return response.headers["content-type"];
  } catch (error) {
    throw Error(`failed to check url contents: ${error}`);
  }
};
