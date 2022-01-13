import { useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { ChannelType } from 'app/models/Channel';
import { DirectChannelsState } from '../../atoms/Channels';
import useRouterCompany from '../router/useRouterCompany';
import ChannelsMineAPIClient from 'app/services/channels/ChannelsMineAPIClient';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import useRouterWorkspace from '../router/useRouterWorkspace';
import { LoadingState } from '../../atoms/Loading';
import { useGlobalEffect } from 'app/services/utils/useGlobalEffect';

export function useDirectChannels(): {
  directChannels: ChannelType[];
  refresh: () => Promise<void>;
} {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const [directChannels, _setDirectChannels] = useRecoilState(
    DirectChannelsState({ companyId, workspaceId }),
  );
  const [, setLoading] = useRecoilState(LoadingState(`channels-direct-${companyId}`));

  const refresh = async () => {
    const directChannels = await ChannelsMineAPIClient.get({ companyId }, { direct: true });

    if (directChannels) _setDirectChannels(directChannels);
  };

  useGlobalEffect(
    'useDirectChannels',
    async () => {
      if (!directChannels) setLoading(true);
      await refresh();

      setLoading(false);
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

  return {
    refresh,
    directChannels,
  };
}
