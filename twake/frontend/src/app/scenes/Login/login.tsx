// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { lazy, Suspense } from 'react';

import InitService from 'app/services/InitService';
const InternalLogin = lazy(() => import('app/scenes/Login/Internal/InternalLogin'));
const ConsoleLogin = lazy(() => import('app/scenes/Login/Console/ConsoleLogin'));

export default () =>
  <Suspense fallback={<></>}>
    { InitService.server_infos?.configuration?.accounts.type === 'console' ? <ConsoleLogin/> : <InternalLogin/> }
  </Suspense>
;