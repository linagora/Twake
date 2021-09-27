import ChatUploadService, { Events } from 'app/components/ChatUploads/ChatUploadService';
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
    const updatedState = list.map(f => cloneDeep(f.state));

    // Update recoil state, pending file list, etc...
    setPendingFilesListState(updatedState);
  });

  useEffect(() => {
    const current = handleUploadChange.current;

    if (current) ChatUploadService.addListener(Events.ON_CHANGE, current);

    return () => {
      ChatUploadService.removeListener(Events.ON_CHANGE, current);
    };
  }, []);

  const pauseOrResumeUpload = (id: string) => ChatUploadService.pauseOrResume(id);

  const cancelUpload = (id: string) => ChatUploadService.cancel(id);

  const getOnePendingFile = (id: string) => ChatUploadService.getPendingFile(id);

  const uploadFiles = async (list: File[]) => await ChatUploadService.upload(list);

  return {
    pendingFilesListState,
    pauseOrResumeUpload,
    cancelUpload,
    getOnePendingFile,
    uploadFiles,
    currentTask,
  };
};
