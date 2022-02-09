import { useRecoilCallback, useRecoilValue } from 'recoil';

import { ChannelType } from 'app/features/channels/types/channel';
import { ChannelState } from '../state/channels';

export function useChannel(channelId: string) {
  const channel = useRecoilValue(ChannelState(channelId));
  return { channel };
}

export function useSetChannel() {
  const set = useRecoilCallback(({ set }) => (channel: ChannelType) => {
    if (channel.id) set(ChannelState(channel.id), channel);
  });
  return { set };
}
