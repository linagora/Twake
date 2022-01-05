import { useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { ChannelType } from 'app/models/Channel';
import { ReachableChannelsState } from '../../atoms/Channels';
import useRouterCompany from '../router/useRouterCompany';
import useRouterWorkspace from '../router/useRouterWorkspace';
import ChannelsReachableAPIClient from 'app/services/channels/ChannelsReachableAPIClient';

export function useReachableChannels(): {
  reachableChannels: ChannelType[];
  refresh: () => void;
} {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const [reachableChannels, _setReachableChannels] = useRecoilState(ReachableChannelsState);

  const refresh = async () => {
    const channels = await ChannelsReachableAPIClient.get(companyId, workspaceId);

    if (channels) _setReachableChannels(channels);
  };

  useEffect(() => {
    companyId.length > 1 && workspaceId.length > 1 && refresh();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, workspaceId]);

  return {
    refresh,
    reachableChannels,
  };
}
