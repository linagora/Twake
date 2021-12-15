import { selector } from 'recoil';
import { ChannelWrittingActivityState } from '../atoms/ChannelWritingActivity';

export const ThreadWrittingActivitySelector = selector<string>({
  key: 'ThreadWrittingActivitySelector',
  get: ({ get }) => get(ChannelWrittingActivityState)?.threadId || '',
});
