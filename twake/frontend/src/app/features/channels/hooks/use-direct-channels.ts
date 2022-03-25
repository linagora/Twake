import { useEffect } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';

import { ChannelType } from 'app/features/channels/types/channel';
import { DirectChannelsState } from '../state/channels';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import ChannelsMineAPIClient from 'app/features/channels/api/channels-mine-api-client';
import { useRealtimeRoom } from 'app/features/global/hooks/use-realtime';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { LoadingState } from 'app/features/global/state/atoms/Loading';
import { useGlobalEffect } from 'app/features/global/hooks/use-global-effect';
import { useSetUserList } from 'app/features/users/hooks/use-user-list';
import { UserType } from 'app/features/users/types/user';
import { useSetChannel } from './use-channel';

export function useRefreshDirectChannels(): {
  refresh: () => Promise<void>;
} {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const { set: setUserList } = useSetUserList('useRefreshDirectChannels');
  const { set } = useSetChannel();

  const _setDirectChannels = useSetRecoilState(DirectChannelsState({ companyId, workspaceId }));

  const refresh = async () => {
    const directChannels = await ChannelsMineAPIClient.get({ companyId }, { direct: true });

    if (directChannels) _setDirectChannels(directChannels);

    const users: UserType[] = [];

    directChannels.forEach(c => {
      if (c.users) users.push(...c.users);
    });

    directChannels.forEach(c => set(c));

    if (users) setUserList(users);
  };

  return { refresh };
}

export function useDirectChannelsSetup() {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const [, setLoading] = useRecoilState(LoadingState(`channels-direct-${companyId}`));
  const [didLoad, setDidLoad] = useRecoilState(
    LoadingState(`channels-direct-did-load-${companyId}`),
  );
  const { refresh } = useRefreshDirectChannels();

  useGlobalEffect(
    'useDirectChannels',
    async () => {
      if (!didLoad) setLoading(true);
      await refresh();
      setLoading(false);
      setDidLoad(true);
    },
    [companyId],
  );

  useRealtimeRoom<ChannelType[]>(
    ChannelsMineAPIClient.websockets(companyId, workspaceId)[0],
    'usePublicOrPrivateChannels',
    (_action, _resource) => {
      if (_action === 'saved') refresh();
    },
  );
}

export function useDirectChannels(): {
  directChannels: ChannelType[];
  refresh: () => Promise<void>;
} {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const [directChannels, _setDirectChannels] = useRecoilState(
    DirectChannelsState({ companyId, workspaceId }),
  );
  const { refresh } = useRefreshDirectChannels();

  return {
    refresh,
    directChannels,
  };
}
