/* eslint-disable @typescript-eslint/no-explicit-any */
import { CompanyType } from 'app/features/companies/types/company';
import { UserPreferencesType, UserType } from 'app/features/users/types/user';
import Api from '../../global/framework/api-service';
import { TwakeService } from '../../global/framework/registry-decorator-service';
import { WebsocketRoom } from '../../global/types/websocket-types';
import WorkspaceAPIClient from '../../workspaces/api/workspace-api-client';
import CurrentUser from '../../../deprecated/user/CurrentUser';
import { setUserList } from '../hooks/use-user-list';
import Logger from 'features/global/framework/logger-service';

export type SearchContextType = {
  scope: 'company' | 'workspace' | 'all';
  companyId?: string;
  workspaceId?: string;
};

type SearchUserApiResponse<T> = {
  next_page_token: unknown;
  resources: T[];
};

@TwakeService('UserAPIClientService')
class UserAPIClientService {
  private readonly prefixUrl: string = '/internal/services/users/v1';
  private realtime: Map<string, WebsocketRoom> = new Map();
  private logger = Logger.getLogger('UserAPIClientService');

  websocket(userId: string): WebsocketRoom {
    return this.realtime.get(userId) || { room: '', token: '' };
  }

  /**
   * Get users from their ID
   *
   * @param id
   */
  private listBuffer: any[] = [];
  async list(
    users: string[] = [],
    companyIds?: string[],
    options?: { bufferize?: boolean; callback?: (res: UserType[]) => void },
  ): Promise<UserType[]> {
    if (options?.bufferize) {
      const isFirst = this.listBuffer.length === 0;

      this.listBuffer = this.listBuffer.concat({
        users: users,
        companies: companyIds,
        callback: options.callback,
      });

      if (isFirst) {
        await new Promise(r => setTimeout(r, 100));

        users = this.listBuffer.reduce(
          (c, acc) => (Array.isArray(c.users) ? acc.concat(c.users) : []),
          [],
        );
        companyIds = this.listBuffer.reduce(
          (c, acc) => (Array.isArray(c.companies) ? acc.concat(c.companies) : []),
          [],
        );
        const callbacks = this.listBuffer.reduce(
          (c, acc) => (Array.isArray(acc) ? acc.push(c.callback) : []),
          [],
        );
        this.listBuffer = [];

        this.list(users, companyIds, {
          bufferize: false,
          callback: (res: UserType[]) => {
            callbacks.forEach((b: (res: UserType[]) => void) => b && b(res));
          },
        });
      }

      return [];
    }

    const res = await new Promise<UserType[]>(resolve =>
      Api.get(
        `/internal/services/users/v1/users${users.length ? `?user_ids=${users.join(',')}` : ''}${
          companyIds?.length ? `?company_ids=${companyIds.join(',')}` : ''
        }`,
        (res: { resources: UserType[] }): void => {
          resolve(res.resources && res.resources.length ? res.resources : []);
        },
      ),
    );

    if (options?.callback) options.callback(res);

    //Update state management
    setUserList(res);

    return res;
  }

  async getCurrentUserCompanies(): Promise<CompanyType[]> {
    return this.listCompanies(CurrentUser.get()?.id || '');
  }

  /**
   * Get all the companies of the given user.
   * If the user is not the current one, it will return the companies intersection.
   *
   * @param userId
   * @returns
   */
  async listCompanies(userId: string): Promise<CompanyType[]> {
    return WorkspaceAPIClient.listCompanies(userId);
  }

  async getCurrent(disableJWTAuthentication = false): Promise<UserType> {
    return Api.get<{ resource: UserType; websocket: WebsocketRoom }>(
      '/internal/services/users/v1/users/me',
      undefined,
      false,
      { disableJWTAuthentication },
    ).then(result => {
      if (!result?.resource?.id) {
        throw new Error('User not found');
      }
      result.resource.id && this.realtime.set(result.resource.id, result.websocket);
      return result.resource;
    });
  }

  async getCompany(companyId: string): Promise<CompanyType> {
    return Api.get<{ resource: CompanyType }>(
      `/internal/services/users/v1/companies/${companyId}`,
    ).then(a => a.resource);
  }

  async logout() {
    return Api.post('users/logout', {});
  }

  async updateUserStatus(user: string) {
    await Api.post<{ resource: string }, { resource: UserType }>(`${this.prefixUrl}/users/me`, {
      resource: user,
    });
  }

  /**
   * Legacy API, will have to be removed!
   *
   * @returns
   */
  async _fetchCurrent(): Promise<UserType> {
    return Api.post<{ timezone: number }, { data: UserType }>(
      'users/current/get',
      { timezone: new Date().getTimezoneOffset() },
      undefined,
      false,
      { disableJWTAuthentication: true },
    ).then(result => result.data);
  }

  async search<T>(
    query: string | undefined,
    context: SearchContextType,
    callback?: (users: T[]) => void,
  ) {
    let result: T[] = [];

    if (query === 'me') {
      const currentUser = await this.getCurrent();
      result = [
        context.scope === 'workspace'
          ? ({ user: currentUser } as unknown as T)
          : (currentUser as unknown as T),
        ...result,
      ];
    } else {
      result = await Api.get<SearchUserApiResponse<T>>(
        this.getSearchUsersRoute(query, context),
      ).then(data => data.resources);
    }

    if (callback) callback(result);

    this.logger.debug(
      `Search by value "${query}" with options`,
      context,
      'Found',
      result.length,
      'users',
    );

    return result;
  }

  getSearchUsersRoute(query = '', context: SearchContextType) {
    let route = '';

    if (context.scope === 'company' || context.scope === 'all') {
      route = `${this.prefixUrl}/users${
        query.length
          ? `?include_companies=1&search=${encodeURIComponent(query)}${
              context.companyId && context.scope === 'company'
                ? `&search_company_id=${context.companyId}`
                : ''
            }`
          : ''
      }`;
    }

    if (context.scope === 'workspace') {
      const workspacePrefix = '/internal/services/workspaces/v1/companies';
      route = `${workspacePrefix}/${context.companyId}/workspaces/${context.workspaceId}/users${
        query.length > 0 ? `?search=${encodeURIComponent(query)}` : ''
      }`;
    }

    return route;
  }

  setUserPreferences(partials: UserPreferencesType) {
    return Api.post<Partial<UserPreferencesType>, Partial<UserPreferencesType>>(
      `${this.prefixUrl}/users/me/preferences`,
      {
        ...partials,
      },
    );
  }
}
const UserAPIClient = new UserAPIClientService();
export default UserAPIClient;
