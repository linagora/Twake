// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { Suspense } from 'react';

import Client from 'app/views/client';
import InitService from 'app/features/global/services/init-service';

export default () => {
  const isAppReady = InitService.useWatcher(() => InitService.app_ready);

  if (!isAppReady) {
    return <div />;
  }

  return (
    <Suspense fallback={<></>}>
      <Client />
    </Suspense>
  );
};
