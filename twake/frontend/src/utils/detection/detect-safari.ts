import { twakeApplicationUrlScheme, wait } from './common';
import { initWindowMessaging, invoke, onWindowMessage, sendWindowMessage, spawnPopup } from './window';

export const detectUsingSafari = async (): Promise<boolean> => {
  let isTwakeDetected = true;
  const handler = spawnPopup();

  initWindowMessaging();

  onWindowMessage('redirected', async () => {
    await wait(55);

    try {
      isTwakeDetected = true;
      sendWindowMessage('force_reload');
      handler.document.location.reload();
    } catch(e) {
      isTwakeDetected = false;
    }
  });

  onWindowMessage('force_reload', async () => {
    await wait(55);

    handler.location.reload();
  });

  return await invoke('popup', async () => {
    handler.location.replace(twakeApplicationUrlScheme);
    sendWindowMessage('redirected');

    await wait(200);
    handler.close();

    return isTwakeDetected;
  });
}
