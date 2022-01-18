// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useEffect, useState } from 'react';
import { Router } from 'react-router';
import { Switch, Route } from 'react-router-dom';
import { RecoilRoot } from 'recoil';

import Integration from 'app/views/integration';
import RouterServices, { RouteType } from './services/RouterService';
import ErrorBoundary from 'app/views/error/error-boundary';
import InitService from './services/InitService';
import useTimeout from './services/hooks/useTimeout';
import ApplicationLoader from './components/Loader/ApplicationLoader';

import 'app/styles/index.less';

const delayMessage = 5000;

export default () => {
  const [displayDelayLoader, setDisplayDelayLoader] = useState(false);
  const [firstRenderDate] = useState(Date.now());

  useEffect(() => {
    InitService.init();
  }, []);

  const server_infos_loaded = InitService.useWatcher(() => InitService.server_infos_loaded);

  useTimeout(() => {
    if (!server_infos_loaded && Date.now() >= firstRenderDate + delayMessage) {
      setDisplayDelayLoader(true);
    }
  }, delayMessage);

  useEffect(() => {
    if (server_infos_loaded) {
      setDisplayDelayLoader(false);
      try {
        window.document.getElementById('app_loader')?.remove();
      } catch (err) {}
    }
  }, [server_infos_loaded]);

  if (displayDelayLoader && !server_infos_loaded) {
    return <ApplicationLoader></ApplicationLoader>;
  }

  if (!server_infos_loaded) {
    return <></>;
  }

  return (
    <RecoilRoot>
      <Integration>
        <Router history={RouterServices.history}>
          <Switch>
            {RouterServices.routes.map((route: RouteType, index: number) => (
              <Route
                key={`${route.key}_${index}`}
                exact={route.exact ? route.exact : false}
                path={route.path}
                component={() =>
                  route.options?.withErrorBoundary ? (
                    <ErrorBoundary key={route.key}>
                      <route.component />
                    </ErrorBoundary>
                  ) : (
                    <route.component key={route.key} />
                  )
                }
              />
            ))}
            {
              <Route
                path="/"
                component={() => {
                  RouterServices.replace(
                    `${
                      RouterServices.pathnames.LOGIN
                    }?auto&${RouterServices.history.location.search.substr(1)}`,
                  );
                  return <div />;
                }}
              />
            }
          </Switch>
        </Router>
      </Integration>
    </RecoilRoot>
  );
};
