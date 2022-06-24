import { MessageFileType } from 'app/features/messages/types/message';
import { atom, selector } from 'recoil';

export type SearchMediasResults = {
  results: MessageFileType[];
  nextPage: string | null;
};

export const SearchMediasResultsState = atom<SearchMediasResults>({
  key: 'SearchMediasResultsState',
  default: { results: [], nextPage: '' },
});

export const SearchMediasResultsNumberSelector = selector<number>({
  key: 'SearchMediasResultsNumberSelector',
  get: ({ get }) => {
    const snapshot = get(SearchMediasResultsState);
    return snapshot.results.length;
  },
});
