import { useEffect } from 'react';
import LoginService from 'app/services/login/LoginService';
import UserAPIClient from 'app/services/user/UserAPIClient';
import { useRecoilState } from 'recoil';
import { CurrentUserState } from '../atoms/CurrentUser';

export const useCurrentUser = () => {
  const [user, setUser] = useRecoilState(CurrentUserState);

  const refresh = async () => {
    setUser(await UserAPIClient.getCurrent());
  };

  //Depreciated way to get use update from LoginService
  LoginService.recoilUpdateUser = setUser;
  useEffect(() => {
    if (!user) {
      LoginService.init();
    }
  }, [user]);

  return { user, setUser, refresh };
};
