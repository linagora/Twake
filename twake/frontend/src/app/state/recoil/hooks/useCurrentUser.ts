import { useEffect } from 'react';
import LoginService from 'app/services/login/LoginService';
import UserAPIClient from 'app/services/user/UserAPIClient';
import { useRecoilState } from 'recoil';
import { CurrentUserState } from '../atoms/CurrentUser';
import { UserType } from 'app/models/User';

export const useCurrentUser = () => {
  const [user, setUser] = useRecoilState(CurrentUserState);

  //Depreciated way to get use update from LoginService
  LoginService.recoilUpdateUser = setUser;
  useEffect(() => {
    if (!user) {
      LoginService.init();
    }
  }, [user]);

  const updateStatus = async (userStatus: string[]) => {
    await UserAPIClient.updateUserStatus(`${userStatus[0]} ${userStatus[1]}`);

    await refresh();
  };

  const refresh = async () => {
    await LoginService.updateUser();
  };

  return { user, refresh, updateStatus };
};
