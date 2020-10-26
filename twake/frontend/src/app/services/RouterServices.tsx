import { createBrowserHistory, History } from 'history';
import short, { Translator } from 'short-uuid';

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

export type ParamsType = {
  workspaceId: string;
  channelId?: string;
  messageId?: string;
};

export type Pathnames = {
  [key: string]: string;
};

class RouterServices {
  translator: Translator = short();
  history: History<unknown> = createBrowserHistory();

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

  // Generate shortened UUID
  public generateClientRoute(params: ParamsType) {
    const shorterWorkspaceId = this.translator.fromUUID(params.workspaceId);
    const shorterChannelId = params.channelId ? this.translator.fromUUID(params.channelId) : 'main';
    /*
      TODO - Multiple routes dispatch 
    */
    return `${this.pathnames.CLIENT}/${shorterWorkspaceId}/c/${shorterChannelId}${
      params.messageId ? '-' + params.messageId : ''
    }`;
  }
}

export default new RouterServices();
