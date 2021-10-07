import { CompanyType } from 'app/models/Company';
import { UserType } from 'app/models/User';
import Api from '../Api';
import { TwakeService } from '../Decorators/TwakeService';
import WorkspaceAPIClient from '../workspaces/WorkspaceAPIClient';
import CurrentUser from './CurrentUser';

@TwakeService('UserAPIClientService')
class UserAPIClient {
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

  /**
   * Get users from their IDs
   *
   * @param users
   * @deprecated use list(users: string[])
   * @returns
   */
  async _list(users: string[] = []): Promise<UserType[]> {
    return new Promise<UserType[]>(resolve => {
      Api.post('/ajax/users/all/get', { id: users }, (res: { data?: UserType[] }) => {
        resolve(res.data || []);
      });
    });
  }

  async getCurrent(disableJWTAuthentication = false): Promise<UserType> {
    return Api.get<{resource: UserType}>(
      '/internal/services/users/v1/users/me',
      undefined,
      false,
      { disableJWTAuthentication },
    ).then(result => result.resource);
  }

  async logout() {
    return Api.post('users/logout', {});
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
}

export default new UserAPIClient();
