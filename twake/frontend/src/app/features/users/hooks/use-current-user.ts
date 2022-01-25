import { useEffect, useRef } from 'react';
import LoginService from 'app/features/global/services/login-service';
import UserAPIClient from 'app/features/users/api/user-api-client';
import { useRecoilState } from 'recoil';
import { CurrentUserState } from '../state/atoms/current-user';
import { useRealtimeRoom } from 'app/features/global/hooks/use-realtime';
import { UserType } from 'app/features/users/types/user';
import Languages from 'app/features/global/services/languages-service';

export const useCurrentUser = () => {
  const [user, setUser] = useRecoilState(CurrentUserState);

  //Depreciated way to get use update from LoginService
  LoginService.recoilUpdateUser = setUser;
  useEffect(() => {
    if (!user) {
      LoginService.init();
    }
  }, [user]);

  //Update app language
  useEffect(() => {
    if (user?.preference?.locale) Languages.setLanguage(user?.preference?.locale);
  }, [user?.preference?.locale]);

  const updateStatus = async (userStatus: string[]) => {
    await UserAPIClient.updateUserStatus(`${userStatus[0]} ${userStatus[1]}`);

    await refresh();
  };

  const refresh = async () => {
    await LoginService.updateUser();
  };

  return { user, refresh, updateStatus };
};

export const useCurrentUserRealtime = () => {
  const { user, refresh } = useCurrentUser();
  const room = UserAPIClient.websocket(user?.id || '');

  const timeout = useRef(0);

  useRealtimeRoom<UserType>(room, 'useCurrentUser', async (action, resource) => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      refresh();
    }, 1000) as any;
  });
};
