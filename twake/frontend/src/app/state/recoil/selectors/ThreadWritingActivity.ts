import { selectorFamily } from 'recoil';
import {
  ChannelWritingActivityType,
  ChannelWritingActivityState,
} from '../atoms/ChannelWritingActivity';

export const ThreadWritingActivitySelector = selectorFamily<
  ChannelWritingActivityType[],
  { channelId: string; threadId: string }
>({
  key: 'ThreadWritingActivitySelector',
  get:
    ({ channelId, threadId }) =>
    ({ get }) => {
      return get(ChannelWritingActivityState(channelId) || []).filter(
        status => !threadId || status.threadId === threadId,
      );
    },
});
