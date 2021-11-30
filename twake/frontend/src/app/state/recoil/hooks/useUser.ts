import { UserType } from 'app/models/User';
import { useRecoilState } from 'recoil';
import { UsersState } from '../atoms/Users';

export const useUser = (userId: string): UserType | undefined => {
  const [user, setUser] = useRecoilState(UsersState(userId));

  //TODO add realtime

  return user;
};
