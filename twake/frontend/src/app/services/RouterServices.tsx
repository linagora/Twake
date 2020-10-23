import { createBrowserHistory } from 'history';

// Import your component here
import App from 'app/scenes/app';
import Login from 'app/scenes/Login/login';
import Setup from 'app/scenes/Setup/Setup';
import Error from 'app/scenes/Error/Error';

export type RouteType = {
  path: string;
  exact?: boolean | false;
  key?: string;
  routes?: RouteType[];
  component?: any;
  options?: any;
};

export type Pathnames = {
  [key: string]: string;
};

class RouterServices {
  history = createBrowserHistory();

  // Define your route here
  public pathnames: Readonly<Pathnames> = {
    CLIENT: '/client',
    CLIENT_APP: '/client/:workspace/c/:channel',
    LOGIN: '/login',
    SETUP: '/setup',
    ERROR: '/error',
  };

  // Setup your route here
  public routes: Readonly<RouteType[]> = [
    {
      path: this.pathnames.LOGIN,
      exact: true,
      key: 'login',
      component: Login,
      options: {
        withErrorBoundary: true,
      },
    },
    {
      path: this.pathnames.SETUP,
      exact: true,
      key: 'setup',
      component: Setup,
      options: {
        withErrorBoundary: true,
      },
    },
    {
      path: this.pathnames.CLIENT,
      key: 'client',
      exact: true,
      component: App,
      options: {
        withErrorBoundary: true,
      },
    },
    {
      path: this.pathnames.CLIENT_APP,
      key: 'client_app',
      component: App,
      options: {
        withErrorBoundary: true,
      },
    },
    {
      path: this.pathnames.ERROR,
      exact: true,
      component: Error,
    },
  ];
}

export default new RouterServices();
