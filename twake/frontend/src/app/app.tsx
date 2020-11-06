import React, { useEffect } from 'react';
import LoginService from 'services/login/login.js';
import Integration from 'scenes/Integration/integration.js';
import RouterServices, { RouteType } from './services/RouterServices';
import { Switch, Route } from 'react-router-dom';
import { Router } from 'react-router';
import ErrorBoundary from 'app/scenes/Error/ErrorBoundary';
import 'app/ui.scss';
import 'app/theme.less';

export default () => {
  useEffect(() => {
    LoginService.init();
  }, []);

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
        </Switch>
      </Router>
    </Integration>
  );
};
