import { getOsWaitingTime, twakeApplicationUrlScheme, wait } from './common';
import { invoke, spawnPopup } from './window'

/**
 * checks if the twake app is installed in the system using the browser
 * 
 * @returns {boolean} true if the twake app is installed
 */
export const detect = async (): Promise<boolean> => {
  let initialLoadingPrimise: Promise<unknown>;

  return await invoke('main', async () => {
    await Promise.all([initialLoadingPrimise, wait(getOsWaitingTime(300, 400))]);

    const handler = spawnPopup();
    let isTwakeDetected = true;

    const input = document.createElement('input');

    input.style.opacity = '0';
    input.style.position = 'absolute';
    input.onfocus = () => {
      isTwakeDetected = false;
    }

    await wait(getOsWaitingTime(40, 100));

    handler.document.body.appendChild(input);
    handler.location.replace(twakeApplicationUrlScheme);

    await wait(getOsWaitingTime(125, 250));

    input.focus();
    await wait(getOsWaitingTime(15, 50));
    input.remove();
    handler.close();
    
    return isTwakeDetected;
  });
}
