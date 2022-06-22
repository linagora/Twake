import { atom, selector } from 'recoil';

export type SearchInput = {
  query: string;

  //Scope
  companyId?: string;
  workspaceId?: string;
  channelId?: string;

  //Additional filters (for later)
  //TODO
};

export const SearchInputState = atom<SearchInput>({
  key: 'SearchInputState',
  default: {
    query: '',
  },
});

export const HasSearchQuerySelector = selector<boolean>({
  key: 'HasSearchQuerySelector',
  get: ({ get }) => {
    const searchInput = get(SearchInputState);
    return searchInput.query.length > 0;
  },
});
