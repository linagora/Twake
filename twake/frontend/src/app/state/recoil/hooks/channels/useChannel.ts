import { useRecoilCallback, useRecoilValue } from 'recoil';

import { ChannelType } from 'app/models/Channel';
import { ChannelState } from '../../atoms/Channels';

export function useChannel(channelId: string) {
  const channel = useRecoilValue(ChannelState(channelId));
  return { channel };
}

//Fixme: it is for retrocompatibility, currently atom is set from channels themselves
export function useSetChannel() {
  const set = useRecoilCallback(({ set }) => (channel: ChannelType) => {
    if (channel.id) set(ChannelState(channel.id), channel);
  });
  return { set };
}
