import { useEffect, useRef } from 'react';
import { useRecoilCallback, useRecoilState } from 'recoil';

import { ChannelType } from 'app/models/Channel';
import { MineChannelsState } from '../../atoms/Channels';
import useRouterCompany from '../router/useRouterCompany';
import ChannelsMineAPIClient from 'app/services/channels/ChannelsMineAPIClient';
import useRouterWorkspace from '../router/useRouterWorkspace';
import { isPrivateChannel, isPublicChannel } from 'app/services/channels/utils';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import { LoadingState } from '../../atoms/Loading';
import { useGlobalEffect } from 'app/services/utils/useGlobalEffect';

export function usePublicOrPrivateChannels(): {
  privateChannels: ChannelType[];
  publicChannels: ChannelType[];
  refresh: () => Promise<void>;
} {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const [mineChannels, _setMineChannels] = useRecoilState(
    MineChannelsState({ companyId, workspaceId }),
  );

  const [, setLoading] = useRecoilState(LoadingState(`channels-${companyId}-${workspaceId}`));

  const refresh = async () => {
    const res = await ChannelsMineAPIClient.get({ companyId, workspaceId });
    if (res) _setMineChannels(res);
  };

  useGlobalEffect(
    'usePublicOrPrivateChannels',
    async () => {
      if (!mineChannels) setLoading(true);
      await refresh();

      setLoading(false);
    },
    [companyId, workspaceId],
  );

  useRealtimeRoom<ChannelType[]>(
    ChannelsMineAPIClient.websockets(companyId, workspaceId)[0],
    'usePublicOrPrivateChannels',
    (_action, _resource) => {
      if (_action === 'saved') refresh();
    },
  );

  return {
    refresh: refresh,
    privateChannels: (mineChannels || [])?.filter(
      c => c.visibility && isPrivateChannel(c.visibility),
    ),
    publicChannels: (mineChannels || [])?.filter(
      c => c.visibility && isPublicChannel(c.visibility),
    ),
  };
}
