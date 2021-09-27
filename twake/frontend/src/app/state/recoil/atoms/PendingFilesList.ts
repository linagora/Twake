import { atom } from 'recoil';
import { PendingFileRecoilType } from 'app/models/File';

export const PendingFilesListState = atom<PendingFileRecoilType[] | undefined>({
  key: 'PendingFilesListState',
  default: undefined,
});
