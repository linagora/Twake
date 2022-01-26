import { UserType } from 'app/features/users/types/user';
import { useRecoilState } from 'recoil';
import { UsersState } from '../state/atoms/users';

export const useUser = (userId: string): UserType | undefined => {
  const [user, setUser] = useRecoilState(UsersState(userId));

  //TODO add realtime

  return user;
};
