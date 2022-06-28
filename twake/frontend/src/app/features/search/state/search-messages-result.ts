import { ChannelType } from 'app/features/channels/types/channel';
import { Message } from 'app/features/messages/types/message';
import { atom, selector } from 'recoil';

export type SearchMessagesResults = {
  results: Message[];
  nextPage: string | null;
};

export const SearchMessagesResultsState = atom<SearchMessagesResults>({
  key: 'SearchMessagesResultsState',
  default: { results: [], nextPage: '' },
});

export const SearchMessagesResultsNumberSelector = selector<number>({
  key: 'SearchMessagesResultsNumberSelector',
  get: ({ get }) => {
    const snapshot = get(SearchMessagesResultsState);
    return snapshot.results.length;
  },
});
