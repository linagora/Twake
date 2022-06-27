import { getBrowserInformation } from './common';
import { TargetWindow, WindowMessageType } from './types';

let popupHandler: Window | null = null;
const messageListeners: Record<string, () => unknown> = {};

/**
 * Checks if the current window instance is a popup window.
 * 
 * @returns {boolean} true if it is a popup window
 */
export function isPopup (): boolean {
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

  if(type === 'popup' && !isPopup()) {
    return await callback();
  }

  return false;
}

/**
 * Gets the initial URL to spawn a popup
 * 
 * @returns {string} the popup initial url
 */
export function getPopupUrl (): string {
  const browserName = getBrowserInformation();

  if (browserName?.name === 'safari') {
    return '/popup';
  }

  return 'about:blank';
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

  popupHandler = window.open(getPopupUrl(), '', 'height=50,width=50,left=9999,top=9999');

  if (!popupHandler) {
    throw new Error('Failed to open popup');
  }

  return popupHandler;
}


/**
 * listen for events on the popup window
 * 
 * @param {keyof WindowEventMap} eventType - the event to listen for
 * @param {Function} callback - the callback to invoke when the event is fired
 * @returns {() => void} a function to unsubscribe from the event
 */
export function listenForPopupEvent(eventType: keyof WindowEventMap, callback: (event: Event) => unknown): () => void {
  popupHandler?.addEventListener(eventType, callback, { once: true });

  return () => popupHandler?.removeEventListener(eventType, callback);
}

/**
 * Binds a callback to a window message event
 * 
 * @param {WindowMessageType} message - the message to send between windows 
 * @param callback - the callback to invoke when the message is received
 */
export const onWindowMessage = (message: WindowMessageType, callback: () => unknown): void => {
  messageListeners[message] = callback;
}

/**
 * Sends a message to a window
 * 
 * @param {WindowMessageType} message - the message to send between windows
 */
export const sendWindowMessage = (message: WindowMessageType): void => {
  const TargetWindow = window.opener || popupHandler;

  TargetWindow?.postMessage(message, document.location.origin);
}

/**
 * Handles a registered window message event by invoking the registered callback
 * 
 * @returns {void}
 */
export const initWindowMessaging = (): void => {
  window.onmessage = (event: MessageEvent) => {
    const message = event.data as WindowMessageType;

    if (messageListeners[message]) {
      messageListeners[message]();
    }
  }
}
