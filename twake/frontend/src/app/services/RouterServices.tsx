import { createBrowserHistory, History } from 'history';
import { matchPath, match } from 'react-router';
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
  options?: {
    withErrorBoundary?: boolean;
  };
};

export type ParamsType = {
  workspaceId: string;
  channelId?: string;
  messageId?: string;
  threadId?: string;
  directoryId?: string;
};

export type Pathnames = {
  [key: string]: string;
};

function RouterServices() {
  const translator: Translator = short();
  const history: History<unknown> = createBrowserHistory();
  const match = (pathSchema: string): match<object> | null =>
    matchPath(history.location.pathname, { path: pathSchema });

  // Define your route here
  const pathnames: Readonly<Pathnames> = {
    CLIENT: '/client',
    CLIENT_APP: '/client/:workspaceId/c/:channelId',
    //TODO
    //CLIENT_APP_THREAD: '/client/:workspaceId/c/:channelId/t/:threadId',
    //CLIENT_APP_DIRECTORY: '/client/:workspaceId/c/:channelId/d/:directoryId',
    LOGIN: '/login',
    SETUP: '/setup',
    ERROR: '/error',
  };

  // Setup your route here
  const routes: Readonly<RouteType[]> = [
    {
      path: pathnames.LOGIN,
      exact: true,
      key: 'login',
      component: Login,
      options: {
        withErrorBoundary: true,
      },
    },
    {
      path: pathnames.SETUP,
      exact: true,
      key: 'setup',
      component: Setup,
      options: {
        withErrorBoundary: true,
      },
    },
    {
      path: pathnames.CLIENT,
      key: 'client',
      exact: true,
      component: App,
      options: {
        withErrorBoundary: true,
      },
    },
    {
      path: pathnames.CLIENT_APP,
      key: 'client_app',
      component: App,
      options: {
        withErrorBoundary: true,
      },
    },
    {
      path: pathnames.ERROR,
      exact: true,
      component: Error,
    },
  ];

  // Generate shortened UUID
  function generateClientRoute(params: ParamsType) {
    const shorter = {
      workspaceId: translator.fromUUID(params.workspaceId),
      channelId: params.channelId ? `/c/${translator.fromUUID(params.channelId)}` : '/c/unknown',
      directoryId: params.directoryId ? `/d/${translator.fromUUID(params.directoryId)}` : '',
      threadId: params.threadId ? `/t/${translator.fromUUID(params.threadId)}` : '',
      messageId: params.messageId ? `/m/${translator.fromUUID(params.messageId)}` : '',
    };
    return `${pathnames.CLIENT}/${shorter.workspaceId}${shorter.channelId}${shorter.directoryId}${shorter.threadId}${shorter.messageId}`;
  }

  return {
    generateClientRoute,
    history,
    match,
    pathnames,
    routes,
    translator,
  };
}

export default RouterServices();
