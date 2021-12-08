import { useEffect } from 'react';
import LoginService from 'app/services/login/LoginService';
import UserAPIClient from 'app/services/user/UserAPIClient';
import { useRecoilState } from 'recoil';
import { CurrentUserState } from '../atoms/CurrentUser';

export const useCurrentUser = () => {
  const [user, setUser] = useRecoilState(CurrentUserState);

  //Depreciated way to get use update from LoginService
  LoginService.recoilUpdateUser = setUser;
  useEffect(() => {
    if (!user) {
      LoginService.init();
    }
  }, [user]);

  const updateStatus = async (user: string) => {
    await UserAPIClient.updateUserStatus(user);
    await refresh();
  };

  const refresh = async () => {
    await LoginService.updateUser();
  };

  return { user, refresh, updateStatus };
};
