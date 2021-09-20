import { atom, AtomEffect } from 'recoil';
import { PendingFileType } from 'app/models/File';
import UserContextState from 'app/state/UserContextState';

const currentPendingFilesListEffect: AtomEffect<PendingFileType[] | undefined> = ({ onSet }) => {
  onSet(pendingFilesList => (UserContextState.pending_files_list = pendingFilesList));
};

export const PendingFilesListState = atom<PendingFileType[] | undefined>({
  key: 'PendingFilesListState',
  default: undefined,
  effects_UNSTABLE: [currentPendingFilesListEffect],
});
