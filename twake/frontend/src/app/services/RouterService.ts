import { createBrowserHistory, History } from 'history';
import { matchPath, match } from 'react-router';
import short, { Translator } from 'short-uuid';

import App from 'app/views/client/app';
import Login from 'app/views/login/login';
import Logout from 'app/views/login/logout';
import Error from 'app/views/error';
import Join from 'app/views/join';
import Collections from 'services/Depreciated/Collections/Collections';

import Workspaces from 'services/workspaces/workspaces';
import Groups from 'services/workspaces/groups';
import Channels from 'app/deprecated/channels/channels';
import PublicMainView from 'app/views/client/main-view/PublicMainView';
import Observable from './Observable/Observable';

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

class RouterServices extends Observable {
  public translator: Translator = short();
  public history: History<unknown> = createBrowserHistory();
  public match = (pathSchema: string): match<object> | null =>
    matchPath(this.history.location.pathname, { path: pathSchema });
  public setRecoilState: (state: ClientStateType) => void = _ => {};

  //List of client sub paths
  clientSubPathnames: Readonly<string[]> = [
    '/client/:companyId',
    '/client/:companyId/w/:workspaceId',
    '/client/:companyId/w/:workspaceId/c/:channelId',
    '/client/:companyId/w/:workspaceId/c/:channelId/t/:threadId',
    '/client/:companyId/w/:workspaceId/c/:channelId/m/:messageId',
    '/client/:companyId/w/:workspaceId/c/:channelId/tab/:tabId/',
    '/client/:companyId/w/:workspaceId/c/:channelId/t/:threadId/m/:messageId',
  ];

  private allowedQueryParameters: Record<string, Map<string, string>> = {
    '/client/:companyId/w/:workspaceId/c/:channelId': new Map<string, string>([['m', 'messageId']]),
  };

  pathnames: Readonly<Pathnames> = {
    CLIENT: '/client',
    SHARED: '/shared/:workspaceId/:appName/:documentId/t/:token',
    LOGIN: '/login',
    LOGOUT: '/logout',
    ERROR: '/error',
    JOIN: '/join/:token',
  };

  UUIDsToTranslate: Readonly<string[]> = [
    'companyId',
    'workspaceId',
    'channelId',
    'messageId',
    'threadId',
    'tabId',
    'directoryId',
    'documentId',
  ];

  readonly routes: RouteType[] = [
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
      path: this.pathnames.LOGOUT,
      exact: true,
      key: 'logout',
      component: Logout,
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
      path: this.pathnames.SHARED,
      key: 'shared',
      exact: true,
      component: PublicMainView,
      options: {
        withErrorBoundary: false,
      },
    },
    {
      path: this.pathnames.ERROR,
      exact: true,
      component: Error,
    },
    {
      path: this.pathnames.JOIN,
      exact: false,
      key: 'join',
      component: Join,
      options: {
        withErrorBoundary: false,
      },
    },
  ];

  constructor() {
    super();
    this.history.listen(() => {
      this.notify();
      this.setRecoilState(this.getStateFromRoute());
    });
  }

  useRouteState(observedScope?: (state: ClientStateType) => ClientStateType): ClientStateType {
    return this.useWatcher(() => {
      const state = this.getStateFromRoute();
      return observedScope ? observedScope(state) : state;
    });
  }

  /**
   * Generate state from routing
   */
  getStateFromRoute(): ClientStateType {
    let match: any = null;
    this.clientSubPathnames
      .concat(this.pathnames.SHARED)
      .sort((a, b) => b.length - a.length)
      .forEach(route => {
        if (!match) {
          match = this.match(route) as any;
        }
      });

    const reducedState: any = {
      companyId: match?.params?.companyId || '',
      workspaceId: match?.params?.workspaceId || '',
      channelId: match?.params?.channelId || '',
      messageId: match?.params?.messageId || '',
      threadId: match?.params?.threadId || '',
      tabId: match?.params?.tabId || '',
      directoryId: match?.params?.directoryId || '',
      documentId: match?.params?.documentId || '',
      token: match?.params?.token || '',
      appName: match?.params?.appName || '',
      shared: !!this.match(this.pathnames.SHARED),
    };

    const queryParameters = this.allowedQueryParameters[match?.path];

    if (queryParameters && this.history.location.search) {
      const params = new URLSearchParams(this.history.location.search);

      params.forEach((value, key) => {
        const alias = queryParameters.get(key);
        if (alias) {
          reducedState[alias] = value;
        }
      });
    }

    const state: any = {};
    Object.keys(reducedState).forEach(key => {
      try {
        state[key] =
          reducedState[key] && this.UUIDsToTranslate.includes(key)
            ? this.translator.toUUID(reducedState[key])
            : reducedState[key];
      } catch (err) {
        state[key] = reducedState[key];
      }
    });

    //Retro compatibility with old code
    Channels.currentChannelFrontId = Collections.get('channels').find(state.channelId)?.front_id;

    return state;
  }

  /**
   * Generate UUID to shortened and create url
   */
  generateRouteFromState(
    params: ClientStateType = {},
    options: { replace?: boolean; keepSearch?: boolean } = {},
  ): string {
    const currentState = this.getStateFromRoute();
    const expandedState: any = options?.replace ? params : Object.assign(currentState, params);
    const state: any = {};
    Object.keys(expandedState).forEach(key => {
      try {
        state[key] =
          expandedState[key] && this.UUIDsToTranslate.includes(key)
            ? this.translator.fromUUID(expandedState[key])
            : expandedState[key];
      } catch (err) {
        state[key] = expandedState[key];
      }
    });

    let search = options?.keepSearch ? '?' + this.history.location.search.substr(1) : '';

    if (state.shared) {
      return (
        `/shared/${state.workspaceId}` +
        (state.documentId ? `/${state.appName}/${state.documentId}` : '') +
        (state.token ? `/t/${state.token}` : '') +
        search
      );
    }

    if (state.tabId) {
      return (
        `${this.pathnames.CLIENT}` +
        (state.companyId ? `/${state.companyId}` : '') +
        (state.workspaceId ? `/w/${state.workspaceId}` : '') +
        (state.channelId ? `/c/${state.channelId}` : '') +
        (state.tabId ? `/tab/${state.tabId}` : '') +
        search
      );
    }

    const searchParameters = new URLSearchParams(search ? search.substring(1) : '');
    if (state.messageId) {
      searchParameters.append('m', state.messageId);
    }
    search = searchParameters.toString() ? `?${searchParameters.toString()}` : '';

    return (
      `${this.pathnames.CLIENT}` +
      (state.companyId ? `/${state.companyId}` : '') +
      (state.workspaceId ? `/w/${state.workspaceId}` : '') +
      (state.channelId ? `/c/${state.channelId}` : '') +
      (state.threadId ? `/t/${state.threadId}` : '') +
      search
    );
  }

  /**
   * Add redirection in url
   */
  addRedirection(route: string): string {
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

  /**
   * If redirection is present in url we redirect the user to it. Otherwise we return false;
   */
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

  push(path: string, state?: unknown): void {
    return this.history.push(path, state);
  }

  replace(path: string, state?: unknown): void {
    return this.history.replace(path, state);
  }
}

export default new RouterServices();
