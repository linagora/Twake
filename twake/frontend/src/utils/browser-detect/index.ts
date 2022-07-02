import { getBrowserInformation } from './common';
import { detect } from './detect';

/**
 * Checks if the twake desktop app is installed in the system.
 *
 * @returns {Promise<boolean>} true if the twake app is installed
 */
export async function detectDesktopAppPresence(path: string): Promise<boolean> {
  const targetBrowser = getBrowserInformation();

  // Chrome on linux is not supported
  if (targetBrowser?.name === 'chrome' && targetBrowser?.os === 'Linux') {
    console.debug('Desktop app detection: Chrome on Linux is not supported');
    return false;
  }

  console.debug(
    `Desktop app detection: target browser: ${targetBrowser?.name} on ${targetBrowser?.os}`,
  );

  return await detect(path);
}
