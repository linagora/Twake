import React, { useEffect } from 'react';
import Integration from 'app/scenes/Integration/Integration';
import RouterServices, { RouteType } from './services/RouterService';
import { Switch, Route } from 'react-router-dom';
import { Router } from 'react-router';
import ErrorBoundary from 'app/scenes/Error/ErrorBoundary';
import 'app/ui.scss';
import InitService from './services/InitService';
import 'app/theme.less';
import AuthProviderService from './services/login/AuthProviderService';
import LoginService from './services/login/login';

export default () => {
  useEffect(() => {
    InitService.init();
  }, []);

  const server_infos_loaded = InitService.useWatcher(() => InitService.server_infos_loaded);

  if (!server_infos_loaded) {
    return <div />;
  }

  if (
    InitService.server_infos?.configuration?.accounts.type === 'console' &&
    !LoginService.getIsPublicAccess()
  ) {
    AuthProviderService.getAuthProviderConfiguration();
  }

  InitService.removeLoader();

  return (
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
  );
};
