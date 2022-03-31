import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';

import { ChannelType } from 'app/features/channels/types/channel';
import { ChannelsState, ChannelSelector } from '../state/channels';
import ChannelAPIClient from '../api/channel-api-client';

//Keep the channels in a easy to use variable
let channelsKeeper: ChannelType[] = [];

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

export function getChannel(channelId: string) {
  return channelsKeeper.find(ch => ch.id === channelId);
}

export function useSetChannel() {
  const set = useRecoilCallback(({ set, snapshot }) => (channel: ChannelType) => {
    if (channel.id) {
      channelsKeeper = channelsKeeper.filter(c => c.id !== channel.id);
      channelsKeeper.push(channel);
      set(ChannelsState, channelsKeeper);
    }
  });
  return { set };
}
