import React from 'react';
import ClientPage from 'app/scenes/Client/Client';
import BadDevice from './BadDevice/BadDevice';
import InitService from 'app/services/InitService';
import LoginService from 'app/services/login/login';

export default () => {
  const isAppReady = InitService.useWatcher(() => InitService.app_ready);

  if (!isAppReady) {
    return <div />;
  }

  const page = (
    <BadDevice force={LoginService.getIsPublicAccess()}>
      <ClientPage />
    </BadDevice>
  );

  return page;
};
