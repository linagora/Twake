import { useRecoilCallback, useRecoilState } from 'recoil';
import { UserType } from 'app/features/users/types/user';
import UserAPIClient from 'app/features/users/api/user-api-client';
import { UserListState } from '../state/atoms/user-list';

const useGetOrFetchUser = () => {
  const [users, setUsers] = useRecoilState(UserListState);

  const fetchUser = useRecoilCallback(() => async (id: string) => {
    const index = users.findIndex(user => user.id === id);
    let user: UserType | null = null;

    if (index > -1) {
      console.log('User already exists', index);
      user = users[index];
    } else {
      console.log('Get new user', id);

      const apiUser = await UserAPIClient.list([id]);

      if (apiUser && apiUser.length) {
        user = apiUser[0];
        setUsers(() => [...users, apiUser[0]]);
      }
    }

    return {
      id,
      user,
    };
  });

  return fetchUser;
};

export default useGetOrFetchUser;
