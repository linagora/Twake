import React from 'react';
import ClientPage from 'app/scenes/Client/Client';
import Globals from 'services/Globals.js';
import WindowService from 'services/utils/window.js';
import BadDevice from './BadDevice/BadDevice';
import InitService from 'app/services/InitService';

export default () => {
  const isAppReady = InitService.useWatcher(() => InitService.app_ready);

  if (!isAppReady) {
    return <div />;
  }

  let publicAccess = false;
  const viewParameter = WindowService.findGetParameter('view') || '';
  if (
    (viewParameter && ['drive_publicAccess'].indexOf(viewParameter) >= 0) ||
    (Globals as any).store_publicAccess_get_data
  ) {
    publicAccess = true;
    (Globals as any).store_publicAccess_get_data = WindowService.allGetParameter();
  }

  return (
    <BadDevice force={publicAccess}>
      <ClientPage />;
    </BadDevice>
  );
};
