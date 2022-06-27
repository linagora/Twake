import { MessageFileType } from 'app/features/messages/types/message';
import { atom, selector } from 'recoil';

export type RecentMedias = {
  results: MessageFileType[];
  nextPage: string | null;
};

export const RecentMediasState = atom<RecentMedias>({
  key: 'RecentMediasState',
  default: { results: [], nextPage: '' },
});
