import FileUploadService, { Events } from 'app/components/FileUploads/FileUploadService';
import { PendingFileType } from 'app/models/File';
import { cloneDeep } from 'lodash';
import { useEffect, useRef } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { PendingFilesListState } from '../atoms/PendingFilesList';
import { CurrentTaskSelector } from '../selectors/CurrentTask';

type HandleUploadChangeType = (list: PendingFileType[]) => void;

export const useUploadHook = () => {
  const [pendingFilesListState, setPendingFilesListState] = useRecoilState(PendingFilesListState);
  const currentTask = useRecoilValue(CurrentTaskSelector);
  const handleUploadChange = useRef<HandleUploadChangeType>(list => {
    const updatedState = list.map(f =>
      cloneDeep({
        id: f.id,
        status: f.status,
        progress: f.progress,
        file: f.backendFile,
      }),
    );
    setPendingFilesListState(updatedState);
  });

  useEffect(() => {
    const current = handleUploadChange.current;

    if (current) FileUploadService.addListener(Events.ON_CHANGE, current);

    return () => {
      FileUploadService.removeListener(Events.ON_CHANGE, current);
    };
  }, []);

  const pauseOrResumeUpload = (id: string) => FileUploadService.pauseOrResume(id);

  const cancelUpload = (id: string) => FileUploadService.cancel(id);

  const getOnePendingFile = (id: string) => FileUploadService.getPendingFile(id);

  const uploadFiles = async (list: File[]) => await FileUploadService.upload(list);

  return {
    pendingFilesListState,
    pauseOrResumeUpload,
    cancelUpload,
    getOnePendingFile,
    uploadFiles,
    currentTask,
  };
};
