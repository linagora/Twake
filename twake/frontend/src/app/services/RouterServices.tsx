import { createBrowserHistory } from 'history';

// Import your component here
import App from 'app/scenes/app';
import Login from 'app/scenes/Login/login';
import Setup from 'app/scenes/Setup/Setup';
import Error from 'app/scenes/Error/Error';

type Route = {
  path: string;
  exact?: boolean | false;
  key?: string;
  routes?: Route[];
  component?: any;
  options?: any;
};

type Pathnames = {
  [key: string]: string;
};

class RouterServices {
  history = createBrowserHistory();

  // Define your route here
  pathnames: Readonly<Pathnames> = {
    CLIENT: '/client',
    LOGIN: '/login',
    SETUP: '/setup',
    ERROR: '/error',
  };

  // Setup your route here
  routes: Readonly<Route[]> = [
    {
      path: this.pathnames.LOGIN,
      exact: true,
      key: 'login_page',
      component: Login,
      options: {
        withErrorBoundary: true,
      },
    },
    {
      path: this.pathnames.SETUP,
      exact: true,
      key: 'twake_not_ready',
      component: Setup,
      options: {
        withErrorBoundary: true,
      },
    },
    {
      path: this.pathnames.CLIENT,
      key: 'root',
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
