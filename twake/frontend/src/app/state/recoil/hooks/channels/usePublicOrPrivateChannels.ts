import { useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { ChannelType } from 'app/models/Channel';
import { MineChannelsState } from '../../atoms/Channels';
import useRouterCompany from '../router/useRouterCompany';
import ChannelsMineAPIClient from 'app/services/channels/ChannelsMineAPIClient';
import useRouterWorkspace from '../router/useRouterWorkspace';
import { isPrivateChannel, isPublicChannel } from 'app/services/channels/utils';

export function usePublicOrPrivateChannels(): {
  privateChannels: ChannelType[];
  publicChannels: ChannelType[];
  refresh: () => void;
} {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const [mineChannels, _setMineChannels] = useRecoilState(MineChannelsState);

  const refresh = async () => {
    const channelsMine = await ChannelsMineAPIClient.get({ companyId, workspaceId });

    if (channelsMine) _setMineChannels(channelsMine);
  };

  useEffect(() => {
    companyId.length > 1 && workspaceId.length > 1 && refresh();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, workspaceId]);

  return {
    refresh,
    privateChannels: mineChannels.filter(c => c.visibility && isPrivateChannel(c.visibility)),
    publicChannels: mineChannels.filter(c => c.visibility && isPublicChannel(c.visibility)),
  };
}
