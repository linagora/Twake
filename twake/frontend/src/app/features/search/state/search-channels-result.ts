import { ChannelType } from 'app/features/channels/types/channel';
import { atom, selector } from 'recoil';

export type SearchChannelsResults = {
  results: ChannelType[];
  nextPage: string | null;
};

export const SearchChannelsResultsState = atom<SearchChannelsResults>({
  key: 'SearchChannelsResultsState',
  default: { results: [], nextPage: '' },
});

export const SearchChannelsResultsNumberSelector = selector<number>({
  key: 'SearchChannelsResultsNumberSelector',
  get: ({ get }) => {
    const snapshot = get(SearchChannelsResultsState);
    return snapshot.results.length;
  },
});
