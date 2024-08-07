import React from 'react';
import ClientPage from 'app/scenes/Client/Client';
import InitService from 'app/services/InitService';

export default () => {
  const isAppReady = InitService.useWatcher(() => InitService.app_ready);

  if (!isAppReady) {
    return <div />;
  }

  return <ClientPage />;
};
