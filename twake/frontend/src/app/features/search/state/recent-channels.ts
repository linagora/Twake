import { ChannelType } from 'app/features/channels/types/channel';
import { atom, selector } from 'recoil';

export type RecentChannels = {
  results: ChannelType[];
  nextPage: string | null;
};

export const RecentChannelsState = atom<RecentChannels>({
  key: 'RecentChannelsState',
  default: { results: [], nextPage: '' },
});
