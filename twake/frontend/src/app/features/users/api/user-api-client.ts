import { CompanyType } from 'app/features/companies/types/company';
import { UserType } from 'app/features/users/types/user';
import Api from '../../global/services/api-service';
import { TwakeService } from '../../global/services/twake-service';
import { WebsocketRoom } from '../../../services/WebSocket/WebSocket';
import WorkspaceAPIClient from '../../workspaces/api/workspace-api-client';
import CurrentUser from '../../../deprecated/user/CurrentUser';

type SearchContextType = {
  scope: 'company' | 'workspace';
  companyId?: string;
  workspaceId?: string;
};

type SearchUserApiResponse<T> = {
  next_page_token: unknown;
  resources: T[];
};

@TwakeService('UserAPIClientService')
class UserAPIClient {
  private readonly prefixUrl: string = '/internal/services/users/v1';
  private realtime: Map<string, WebsocketRoom> = new Map();

  websocket(userId: string): WebsocketRoom {
    return this.realtime.get(userId) || { room: '', token: '' };
  }

  /**
   * Get users from their ID
   *
   * @param id
   */
  async list(users: string[] = []): Promise<UserType[]> {
    return new Promise<UserType[]>(resolve => {
      Api.get(
        `/internal/services/users/v1/users?user_ids=${users.join(',')}`,
        (res: { resources: UserType[] }): void => {
          resolve(res.resources && res.resources.length ? res.resources : []);
        },
      );
    });
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

  async search<T>(query: string, context: SearchContextType, callback?: (users: T[]) => void) {
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

    return result;
  }

  getSearchUsersRoute(query: string = '', context: SearchContextType) {
    let route = '';

    if (context.scope === 'company') {
      route = `${this.prefixUrl}/users${
        query.length
          ? `?search=${encodeURIComponent(query)}${
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
}

export default new UserAPIClient();
