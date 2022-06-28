import { TargetWindow } from './types';

let popupHandler: Window | null = null;

/**
 * Checks if the current window instance is a popup window.
 * 
 * @returns {boolean} true if it is a popup window
 */
function isPopup (): boolean {
  return window.opener !== null && window.opener !== window;
}

/**
 * invoke instructions on desired window
 * 
 * @param {TargetWindow} type the window to invoke the instructions on
 * @param {Function} callback the instructions to invoke
 * @returns {Promise<void>}
 */
export async function invoke(type: TargetWindow, callback: () => Promise<boolean>): Promise<boolean> {
  if(type === 'main' && !isPopup()) {
    return await callback();
  }

  return false;
}

/**
 * Creates a new window to spawn a popup
 *
 * @returns {Window} the popup window
 */
export const spawnPopup = (): Window => {
  if (popupHandler) {
    return popupHandler;
  }

  popupHandler = window.open('about:blank', '', 'height=50,width=50,left=9999,top=9999');

  if (!popupHandler) {
    throw new Error('Failed to open popup');
  }

  return popupHandler;
}

