import FileUploadService from 'app/components/FileUploads/FileUploadService';
import { selector } from 'recoil';
import { PendingFilesListState } from '../atoms/PendingFilesList';

export const CurrentTaskSelector = selector({
  key: 'CurrentTaskFilesSelector',
  get: ({ get }) => {
    const list = get(PendingFilesListState);

    const currentTaskFiles = list
      ? list.filter(
          f =>
            FileUploadService.getPendingFile(f.id).uploadTaskId ===
              FileUploadService.currentTaskId || f.status === 'error',
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
