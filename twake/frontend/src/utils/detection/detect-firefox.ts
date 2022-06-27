import { twakeApplicationUrlScheme, wait } from './common';
import { invoke, listenForPopupEvent, spawnPopup } from './window';

/**
 * Detects if the twake app is installed in the system using the Firefox browser
 *
 * @returns {Promise<boolean>} true if the twake app is installed
 */
export const detectUsingFirefox = async (): Promise<boolean> => {
  const firefoxDefaultWaitingTime = 200;
  let firefixWaitingTime = firefoxDefaultWaitingTime;

  return await invoke('main', async () => {
    await wait(300);
    let handler: Window | null = null;

    try {
      handler = spawnPopup();
    } catch (e) {
      return false;
    }
  
    const detectionStartTime = performance.now();

    const unsubscribe = listenForPopupEvent('load', () => {
      const diff = performance.now() - detectionStartTime;

      if (firefixWaitingTime === firefoxDefaultWaitingTime) {
        firefixWaitingTime = diff + 15;
      }
    });

    const iframe = document.createElement('iframe');

    iframe.src = twakeApplicationUrlScheme;
    iframe.style.opacity = '0';
    handler.document.body.appendChild(iframe);

    await wait(firefixWaitingTime);
    unsubscribe();

    const isTwakeDetected = !!iframe.contentDocument;
    handler.location.replace('about:blank');
    handler.close();

    return isTwakeDetected;
  });
}
