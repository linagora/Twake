import { atomFamily } from 'recoil';

export type AtomChannelIdKey = {
  threadId: string;
  userId: string;
  name: string;
  isWritting: boolean;
};

export const ChannelWrittingActivityState = atomFamily<AtomChannelIdKey[], AtomChannelIdKey>({
  key: 'ChannelWrittingActivityState',
  default: AtomChannelIdKey => {
    return {};
  },
});
