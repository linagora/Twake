import { useEffect } from 'react';
import { useRecoilCallback, useRecoilValue } from 'recoil';

import { OnlineUserStateFamily, OnlineUserType } from '../state/atoms/online-users';
import { OnlineUserRealtimeAPI } from '../api/online-user-realtime-api-client';
import WebSocketFactory from '../../global/services/websocket-factory-service';
import useRouterCompany from 'app/features/router/hooks/use-router-company';

export const useOnlineUser = (id: string): OnlineUserType => {
  const companyId = useRouterCompany();
  const OnlineAPI = OnlineUserRealtimeAPI(WebSocketFactory.get(), companyId);

  const updateUser = useRecoilCallback(
    ({ set }) =>
      (status: { id: string; connected: boolean }) => {
        set(OnlineUserStateFamily(status.id), {
          ...status,
          lastSeen: Date.now(),
          initialized: true,
        });
      },
    [],
  );

  const state = useRecoilValue(OnlineUserStateFamily(id));

  useEffect(() => {
    if (state && !state.initialized) {
      OnlineAPI.getUserStatus(id).then(status => {
        updateUser({ id: status[0], connected: status[1] });
      });
    }
  }, [state, id]);

  return state;
};
