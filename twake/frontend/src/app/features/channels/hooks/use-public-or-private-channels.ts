import { useEffect, useRef } from 'react';
import { useRecoilCallback, useRecoilState } from 'recoil';

import { ChannelType } from 'app/features/channels/types/channel';
import { MineChannelsState } from '../state/channels';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import ChannelsMineAPIClient from 'app/features/channels/api/channels-mine-api-client';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { isPrivateChannel, isPublicChannel } from 'app/features/channels/utils/utils';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import { LoadingState } from 'app/state/recoil/atoms/Loading';
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
