import { detect,  } from "detect-browser";
import { BrowserInformation } from './types';

export const twakeApplicationUrlScheme = 'twake://check';

/**
 * Detects the current browser and operating system.
 * 
 * @returns {BrowserInformation | null} the browser information or null if it could not be detected
 */
export const getBrowserInformation = (): BrowserInformation | null => {
  const browser = detect();

  if(!browser) 
    return null;

  return {
    name: browser.name,
    version: browser.version,
    os: browser.os
  }
}

/**
 * Checks if the browser OS is Windows
 * 
 * @returns {boolean} true if the detected OS is Windows
 */
const isWindows = (): boolean => {
  const browser = detect();
  const platformCheck = navigator.platform.indexOf('Win') > -1;

  if(browser && browser.os) {
    return browser.os?.startsWith('Win') || platformCheck;
  }

  return platformCheck;
}

/**
 * Get the waiting time based on the OS
 * 
 * @param {Number} normal - the normal waiting time value
 * @param {Number} windowsTiming - the timing for windows
 * @returns {Number} the adjusted timing
 */
export const getOsWaitingTime = (normal: number, windowsTiming: number): number => {
  return isWindows() ? windowsTiming : normal;
}

/**
 * Waits for the specified amount of time
 * 
 * @param {number} ms - the number of milliseconds to wait 
 * @returns {Promise<void>}
 */
export const wait = async (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
