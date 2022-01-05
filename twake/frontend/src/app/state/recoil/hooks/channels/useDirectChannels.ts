import { useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { ChannelType } from 'app/models/Channel';
import { DirectChannelsState } from '../../atoms/Channels';
import useRouterCompany from '../router/useRouterCompany';
import ChannelsMineAPIClient from 'app/services/channels/ChannelsMineAPIClient';

export function useDirectChannels(): {
  directChannels: ChannelType[];
  refresh: () => void;
} {
  const companyId = useRouterCompany();
  const [directChannels, _setDirectChannels] = useRecoilState(DirectChannelsState);

  const refresh = async () => {
    const directChannels = await ChannelsMineAPIClient.get({ companyId }, { direct: true });

    if (directChannels) _setDirectChannels(directChannels);
  };

  useEffect(() => {
    companyId.length > 1 && refresh();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  return {
    refresh,
    directChannels,
  };
}
