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
      Api.post('/ajax/users/all/get', { id: users }, (res: { data?: UserType[] }) => {
        resolve(res.data || []);
      });
    });
  }
}

export default new UserAPIClient();
