import { useRecoilState, useSetRecoilState } from 'recoil';

import { ChannelType } from 'app/features/channels/types/channel';
import { MineChannelsState } from '../state/channels';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import ChannelsMineAPIClient from 'app/features/channels/api/channels-mine-api-client';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { isPrivateChannel, isPublicChannel } from 'app/features/channels/utils/utils';
import { useRealtimeRoom } from 'app/features/global/hooks/use-realtime';
import { LoadingState } from 'app/features/global/state/atoms/Loading';
import { useGlobalEffect } from 'app/features/global/hooks/use-global-effect';
import { useSetChannel } from './use-channel';

export function useRefreshPublicOrPrivateChannels(): {
  refresh: () => Promise<void>;
} {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const _setMineChannels = useSetRecoilState(MineChannelsState({ companyId, workspaceId }));
  const { set } = useSetChannel();

  const refresh = async () => {
    const res = await ChannelsMineAPIClient.get({ companyId, workspaceId });
    res.forEach(c => set(c));
    if (res) _setMineChannels(res);
  };

  return { refresh };
}

export function usePublicOrPrivateChannelsSetup() {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const [, setLoading] = useRecoilState(LoadingState(`channels-${companyId}-${workspaceId}`));
  const [didLoad, setDidLoad] = useRecoilState(
    LoadingState(`channels-did-load-${companyId}-${workspaceId}`),
  );
  const { refresh } = useRefreshPublicOrPrivateChannels();

  useGlobalEffect(
    'usePublicOrPrivateChannels',
    async () => {
      if (!didLoad) setLoading(true);
      await refresh();
      setLoading(false);
      setDidLoad(true);
    },
    [companyId, workspaceId],
  );

  //Public channels
  useRealtimeRoom<ChannelType[]>(
    ChannelsMineAPIClient.websockets(companyId, workspaceId)[0],
    'usePublicOrPrivateChannelsPublic',
    (_action) => {
      //TODO replace this to avoid calling backend every time
      if (_action === 'saved') refresh();
    },
  );

  //Private channels
  useRealtimeRoom<ChannelType[]>(
    ChannelsMineAPIClient.websockets(companyId, workspaceId)[1],
    'usePublicOrPrivateChannelsPrivate',
    (_action) => {
      //TODO replace this to avoid calling backend every time
      if (_action === 'saved') refresh();
    },
  );
}

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

  const { refresh } = useRefreshPublicOrPrivateChannels();

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
