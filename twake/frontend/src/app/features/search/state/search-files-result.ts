import { MessageFileType } from 'app/features/messages/types/message';
import { atom, selector } from 'recoil';

export type SearchFilesResults = {
  results: MessageFileType[];
  nextPage: string | null;
};

export const SearchFilesResultsState = atom<SearchFilesResults>({
  key: 'SearchFilesResultsState',
  default: { results: [], nextPage: '' },
});

export const SearchFilesResultsNumberSelector = selector<number>({
  key: 'SearchFilesResultsNumberSelector',
  get: ({ get }) => {
    const snapshot = get(SearchFilesResultsState);
    return snapshot.results.length;
  },
});
