import { getBrowserInformation } from './common';
import { detectUsingChrome } from './detect-chrome';
import { detectUsingFirefox } from './detect-firefox';
import { detectUsingSafari } from './detect-safari';

/**
 * Checks if the twake desktop app is installed in the system.
 *
 * @returns {Promise<boolean>} true if the twake app is installed
 */
export async function detectDesktopAppPresence (): Promise<boolean> {
  const targetBrowser = getBrowserInformation();

  // Chrome on linux is not supported
  if (targetBrowser?.name === 'chrome' && targetBrowser?.os === 'Linux') {
    console.debug('Desktop app detection: Chrome on Linux is not supported');
    return false;
  }

  console.debug(`Desktop app detection: target browser: ${targetBrowser?.name} on ${targetBrowser?.os}`);

  switch (targetBrowser?.name) {
    case 'chrome':
      return await detectUsingChrome();
    case 'firefox':
      return await detectUsingFirefox();
    case 'safari':
      return await detectUsingSafari();
    default:
      return false;
  }
}
