import { useRecoilCallback, useRecoilState } from 'recoil';

import { ChannelType } from 'app/features/channels/types/channel';
import { ChannelState } from '../state/channels';
import ChannelAPIClient from '../api/channel-api-client';

export function useChannel(channelId: string) {
  const [channel, setChannel] = useRecoilState(ChannelState(channelId));

  const save = async (channel: ChannelType) => {
    const ch = await ChannelAPIClient.save(channel, {
      companyId: channel.company_id || '',
      workspaceId: channel.workspace_id || '',
      channelId: channel.id,
    });
    setChannel(channel);
  };

  return { channel, save };
}

export function useSetChannel() {
  const set = useRecoilCallback(({ set }) => (channel: ChannelType) => {
    if (channel.id) set(ChannelState(channel.id), channel);
  });
  return { set };
}
