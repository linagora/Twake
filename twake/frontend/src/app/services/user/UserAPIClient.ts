import { UserType } from 'app/models/User';
import Api from '../Api';
import { TwakeService } from '../Decorators/TwakeService';

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

  /**
   * Get users from their IDs
   *
   * @param users
   * @deprecated use list(users: string[])
   * @returns
   */
  async _list(users: string[] = []): Promise<UserType[]> {
    return new Promise<UserType[]>(resolve => {
      Api.post('users/all/get', { id: users }, (res: { data?: UserType[] }) => {
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

  /**
   * Legacy API, will have to be removed!
   *
   * @returns
   */
  async _fetchCurrent(): Promise<UserType> {
    return Api.post<{ data: UserType }>(
      'users/current/get',
      { timezone: new Date().getTimezoneOffset() },
      undefined,
      false,
      { disableJWTAuthentication: true },
    ).then(result => result.data);

  }
}

export default new UserAPIClient();
