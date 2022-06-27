import { MessageFileType } from 'app/features/messages/types/message';
import { atom, selector } from 'recoil';

export type RecentFiles = {
  results: MessageFileType[];
  nextPage: string | null;
};

export const RecentFilesState = atom<RecentFiles>({
  key: 'RecentFilesState',
  default: { results: [], nextPage: '' },
});
