// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useEffect, useState } from 'react';
import { Router } from 'react-router';
import { Switch, Route } from 'react-router-dom';
import { RecoilRoot } from 'recoil';

import Integration from 'app/scenes/Integration/Integration';
import RouterServices, { RouteType } from './services/RouterService';
import ErrorBoundary from 'app/scenes/Error/ErrorBoundary';
import InitService from './services/InitService';
import UserContext from './state/recoil/integration/UserContext';
import useTimeout from './services/hooks/useTimeout';
import ApplicationLoader from './components/Loader/ApplicationLoader';
import useRouterChannel from './state/recoil/hooks/useRouterChannel';
import useRouterCompany from './state/recoil/hooks/useRouterCompany';
import useRouterWorkspace from './state/recoil/hooks/useRouterWorkspace';

import 'app/ui.scss';
import 'app/theme.less';

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
      <UserContext />
      <Integration>
        <Router history={RouterServices.history}>
          <Switch>
            {RouterServices.routes.map((route: RouteType, index: number) =>
              <Route
                key={`${route.key}_${index}`}
                exact={route.exact ? route.exact : false}
                path={route.path}
                component={() =>
                  route.options?.withErrorBoundary
                  ?
                  <ErrorBoundary key={route.key}>
                    <route.component />
                  </ErrorBoundary>
                  :
                  <route.component key={route.key} />
                }
              />
            )}
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

export const TestToto = () => {
  const companyId = useRouterCompany()
  const workspaceId = useRouterWorkspace()
  const channelId = useRouterChannel()
  return <div style={{position: "absolute",top:100, left:600, zIndex: 1000, width: "100px", height: "100px", background: "grey",pointerEvents: "none" }}> {channelId} </div>
}