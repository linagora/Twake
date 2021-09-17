// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useEffect } from 'react';
import { Router } from 'react-router';
import { Switch, Route } from 'react-router-dom';
import { RecoilRoot } from 'recoil';

import Integration from 'app/scenes/Integration/Integration';
import RouterService, { RouteType } from './services/RouterService';
import ErrorBoundary from 'app/scenes/Error/ErrorBoundary';
import InitService from './services/InitService';
import AuthService from './services/Auth/AuthService';
import UserContext from './state/recoil/integration/UserContext';

import 'app/ui.scss';
import 'app/theme.less';
import { useLogin } from './services/login/useLogin';

export default () => {
  useEffect(() => {
    InitService.init();
  }, []);

  const server_infos_loaded = InitService.useWatcher(() => InitService.server_infos_loaded);
  const { init } = useLogin();

  useEffect(() => {
    if (server_infos_loaded) {
      try {
        window.document.getElementById('app_loader')?.remove();
      } catch (err) {}
    }
  }, [server_infos_loaded]);

  useEffect(() => {
    console.log("LOGIN FROM app.tsx", server_infos_loaded);
    if (server_infos_loaded) {
      if (AuthService.getAccountType() === 'console') {
        init();
      }
    }
  }, [server_infos_loaded, init]);

  if (!server_infos_loaded) {
    return <div />;
  }

  if (!RouterService.isPublicAccess()) {
    // TODO This can be moved as context provider and then used correctly in components
    AuthService.getProvider();
  }

  // TODO: Check auth
  // TODO: handle internal login
  //if (AuthService.getAccountType() === 'internal') {
  //  RouterService.replace(
  //    `${
  //      RouterService.pathnames.LOGIN
  //    }?auto&${RouterService.history.location.search.substr(1)}`);
  //    return <></>;
  //}

  //if (AuthService.getAccountType() === 'console') {
  //  console.log("AUTH");
  //  LoginService.init();
  //  return <></>;
  //}

  return (
    <RecoilRoot>
      <UserContext/>
      <Integration>
        <Router history={RouterService.history}>
          <Switch>
            {RouterService.routes.map((route: RouteType, index: number) => {
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
            {//
             // AuthService.getAccountType() === "internal" &&
             // <Route
             //   path="/"
             //   component={() => {
             //     RouterService.replace(
             //       `${
             //         RouterService.pathnames.LOGIN
             //       }?auto&${RouterService.history.location.search.substr(1)}`,
             //     );
             //     return <div />;
             //   }}
             // />
            }
          </Switch>
        </Router>
      </Integration>
    </RecoilRoot>
  );
};
