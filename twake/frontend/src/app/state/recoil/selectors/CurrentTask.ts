import ChatUploadService from 'app/components/ChatUploads/ChatUploadService';
import { selector } from 'recoil';
import { PendingFilesListState } from '../atoms/PendingFilesList';

export const CurrentTaskSelector = selector({
  key: 'CurrentTaskFilesSelector',
  get: ({ get }) => {
    const list = get(PendingFilesListState);

    const currentTaskFiles = list
      ? list.filter(
          f =>
            ChatUploadService.getPendingFile(f.id).uploadTaskId ===
              ChatUploadService.currentTaskId || f.status === 'error',
        )
      : [];

    return {
      files: currentTaskFiles,
      total: currentTaskFiles.length,
      uploaded: currentTaskFiles.filter(f => f.status === 'success').length,
      completed: currentTaskFiles.every(f => f.status === 'success'),
    };
  },
});
