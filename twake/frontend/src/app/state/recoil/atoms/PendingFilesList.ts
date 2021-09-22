import { atom, AtomEffect } from 'recoil';
import { PendingFileStateType } from 'app/models/File';
import UserContextState from 'app/state/UserContextState';

const currentPendingFilesListEffect: AtomEffect<PendingFileStateType[] | undefined> = ({
  onSet,
}) => {
  onSet(pendingFilesList => (UserContextState.pending_files_list = pendingFilesList));
};

export const PendingFilesListState = atom<PendingFileStateType[] | undefined>({
  key: 'PendingFilesListState',
  default: undefined,
  effects_UNSTABLE: [currentPendingFilesListEffect],
});
