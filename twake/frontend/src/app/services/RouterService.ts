import { createBrowserHistory, History } from 'history';
import { matchPath, match } from 'react-router';
import short, { Translator } from 'short-uuid';

// Import your component here
import App from 'app/scenes/App';
import Login from 'app/scenes/Login/login';
import Setup from 'app/scenes/Setup/Setup';
import Error from 'app/scenes/Error/Error';
import Collections from 'services/Depreciated/Collections/Collections';
import { useParams } from 'react-router-dom';

import Workspaces from 'services/workspaces/workspaces';
import Groups from 'services/workspaces/groups';
import Channels from 'services/channels/channels';

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

export type ClientStateType = {
  companyId?: string;
  workspaceId?: string;
  channelId?: string;
  messageId?: string;
  threadId?: string;
  tabId?: string;
  directoryId?: string;
};

export type Pathnames = {
  [key: string]: string;
};

class RouterServices {
  public translator: Translator = short();
  public history: History<unknown> = createBrowserHistory();
  public match = (pathSchema: string): match<object> | null =>
    matchPath(this.history.location.pathname, { path: pathSchema });

  //List of client sub paths
  clientSubPathnames: string[] = [
    '/client/:workspaceId',
    '/client/:workspaceId/c/:channelId',
    '/client/:workspaceId/c/:channelId/t/:threadId',
    '/client/:workspaceId/c/:channelId/m/:messageId',
    '/client/:workspaceId/c/:channelId/tab/:tabId/',
    '/client/:workspaceId/c/:channelId/t/:threadId/m/:messageId',
  ];

  // Define your route here
  pathnames: Readonly<Pathnames> = {
    CLIENT: '/client',
    LOGIN: '/login',
    SETUP: '/setup',
    ERROR: '/error',
  };

  // Setup your route here
  routes: Readonly<RouteType[]> = [
    //TODO add parameters / account / workspace creation pages
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
      exact: false,
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

  useStateFromRoute(): ClientStateType {
    useParams();
    return this.getStateFromRoute();
  }

  // Generate state from routing
  getStateFromRoute(): ClientStateType {
    let match: any = null;
    this.clientSubPathnames
      .sort((a, b) => b.length - a.length)
      .forEach(route => {
        if (!match) {
          match = this.match(route) as any;
        }
      });
    const reducedState: any = {
      companyId: '',
      workspaceId: match?.params?.workspaceId || '',
      channelId: match?.params?.channelId || '',
      messageId: match?.params?.messageId || '',
      threadId: match?.params?.threadId || '',
      tabId: match?.params?.tabId || '',
      directoryId: match?.params?.directoryId || '',
    };

    const state: any = {};
    Object.keys(reducedState).forEach(key => {
      try {
        state[key] = reducedState[key] ? this.translator.toUUID(reducedState[key]) : '';
      } catch (err) {
        state[key] = reducedState[key];
      }
    });

    //Retrocompatibility with old code
    state.companyId = Collections.get('workspaces').find(state.workspaceId)?.group?.id;
    Workspaces.updateCurrentWorkspaceId(state.workspaceId);
    Workspaces.currentGroupId = state.companyId;
    Groups.currentGroupId = state.companyId;
    Channels.currentChannelFrontId = Collections.get('channels').find(state.channelId)?.front_id;

    return state;
  }

  // Generate UUID to shortened and create url
  generateRouteFromState(
    params: ClientStateType,
    options: { replace?: boolean; keepSearch?: boolean } = {},
  ) {
    const currentState = this.getStateFromRoute();
    const expandedState: any = options?.replace ? params : Object.assign(currentState, params);
    const state: any = {};
    Object.keys(expandedState).forEach(key => {
      try {
        state[key] = expandedState[key] ? this.translator.fromUUID(expandedState[key]) : '';
      } catch (err) {
        state[key] = expandedState[key];
      }
    });

    const search = options?.keepSearch ? '?' + this.history.location.search.substr(1) : '';

    if (state.tabId) {
      return (
        `${this.pathnames.CLIENT}/${state.workspaceId}` +
        (state.channelId ? `/c/${state.channelId}` : '') +
        (state.tabId ? `/tab/${state.tabId}` : '') +
        search
      );
    }

    return (
      `${this.pathnames.CLIENT}/${state.workspaceId}` +
      (state.channelId ? `/c/${state.channelId}` : '') +
      (state.threadId ? `/t/${state.threadId}` : '') +
      (state.messageId ? `/m/${state.messageId}` : '') +
      search
    );
  }

  // Add redirection in url
  addRedirection(route: string) {
    const existingRef = decodeURIComponent(
      (this.history.location.search.split('ref=')[1] || '').split('&')[0],
    );
    const ref = existingRef ? existingRef : document.location + '';
    const separator = route.indexOf('?') < 0 ? '?' : '&';
    if (route === document.location.pathname) {
      return route;
    }
    return route + separator + 'ref=' + encodeURIComponent(ref);
  }

  // If redirection is present in url we redirect the user to it. Otherwise we return false;
  useRedirection(): boolean {
    const existingRef = decodeURIComponent(
      (this.history.location.search.split('ref=')[1] || '').split('&')[0],
    );
    if (existingRef) {
      document.location.assign(existingRef);
      return true;
    }
    return false;
  }
}

export default new RouterServices();
