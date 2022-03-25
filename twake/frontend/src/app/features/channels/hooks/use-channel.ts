import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';

import { ChannelType } from 'app/features/channels/types/channel';
import { ChannelsState, ChannelSelector } from '../state/channels';
import ChannelAPIClient from '../api/channel-api-client';

export function useChannel(channelId: string) {
  const channel = useRecoilValue(ChannelSelector(channelId)) as ChannelType;
  const { set } = useSetChannel();

  const save = async (channel: ChannelType) => {
    const _ = await ChannelAPIClient.save(channel, {
      companyId: channel.company_id || '',
      workspaceId: channel.workspace_id || '',
      channelId: channel.id,
    });
    set(channel);
  };

  return { channel, save };
}

export function useSetChannel() {
  const set = useRecoilCallback(({ set, snapshot }) => (channel: ChannelType) => {
    if (channel.id) {
      let list = snapshot.getLoadable(ChannelsState).valueMaybe() || [];
      list = list.filter(c => c.id !== channel.id);
      list.push(channel);
      set(ChannelsState, list);
    }
  });
  return { set };
}
