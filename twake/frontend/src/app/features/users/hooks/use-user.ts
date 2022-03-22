import { useRecoilState, useRecoilValue } from 'recoil';

import { useGlobalEffect } from 'app/features/global/hooks/use-global-effect';
import { useRealtimeRoom } from 'app/features/global/hooks/use-realtime';
import { LoadingState } from 'app/features/global/state/atoms/Loading';
import { UserType } from 'app/features/users/types/user';
import UserAPIClient from '../api/user-api-client';
import { UserSelector, UserByUsernameSelector } from '../state/selectors/user-selector';
import { useSetUserList } from './use-user-list';

export const useUserByUsername = (username: string): UserType | undefined => {
  const userId = useRecoilValue(UserByUsernameSelector(username));
  return useRecoilValue(UserSelector(userId || ''));
};

export const useUser = (userId: string): UserType | undefined => {
  const { set: setUserList } = useSetUserList('useUser');
  const user = useRecoilValue(UserSelector(userId));
  const [, setLoading] = useRecoilState(LoadingState(`user-${userId}`));

  const refresh = async () => {
    setLoading(true);
    const updatedUser = (await UserAPIClient.list([userId]))?.[0];

    if (updatedUser) setUserList([updatedUser]);
    setLoading(false);
  };

  useGlobalEffect(
    `use-user-${userId}`,
    () => {
      if (!user) refresh();
    },
    [],
  );

  const room = UserAPIClient.websocket(userId);
  useRealtimeRoom<UserType>(room, 'useUser', (_action, _event) => {
    refresh();
  });

  return user;
};
