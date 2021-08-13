// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useEffect } from 'react';
import { Router } from 'react-router';
import { Switch, Route } from 'react-router-dom';
import { RecoilRoot } from 'recoil';

import Integration from 'app/scenes/Integration/Integration';
import RouterServices, { RouteType } from './services/RouterService';
import ErrorBoundary from 'app/scenes/Error/ErrorBoundary';
import InitService from './services/InitService';
import LoginProviderService from './services/login/strategies/LoginProviderService';
import LoginService from './services/login/login';
import UserContext from './state/recoil/integration/UserContext';

import 'app/ui.scss';
import 'app/theme.less';

export default () => {
  useEffect(() => {
    InitService.init();
  }, []);

  const server_infos_loaded = InitService.useWatcher(() => InitService.server_infos_loaded);

  useEffect(() => {
    if (server_infos_loaded) {
      try {
        window.document.getElementById('app_loader')?.remove();
      } catch (err) {}
    }
  }, [server_infos_loaded]);

  if (!server_infos_loaded) {
    return <div />;
  }

  if (!LoginService.getIsPublicAccess()) {
    // TODO This can be moved as context provider and then used correctly in components
    LoginProviderService.get();
  }

  return (
    <RecoilRoot>
      <UserContext/>
      <Integration>
        <Router history={RouterServices.history}>
          <Switch>
            {RouterServices.routes.map((route: RouteType, index: number) => {
              return (
                <Route
                  key={`${route.key}_${index}`}
                  exact={route.exact ? route.exact : false}
                  path={route.path}
                  component={() => {
                    if (route.options?.withErrorBoundary === true) {
                      return (
                        <ErrorBoundary key={route.key}>
                          <route.component />
                        </ErrorBoundary>
                      );
                    }
                    return <route.component key={route.key} />;
                  }}
                />
              );
            })}
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
          </Switch>
        </Router>
      </Integration>
    </RecoilRoot>
  );
};
