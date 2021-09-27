import ChatUploadService from 'app/components/ChatUploads/ChatUploadService';
import { PendingFileStateType, PendingFileType } from 'app/models/File';
import { cloneDeep } from 'lodash';
import { useEffect, useRef } from 'react';
import { useRecoilState } from 'recoil';
import { PendingFilesListState } from '../atoms/PendingFilesList';

type HandleUploadChangeType = (list: PendingFileType[]) => void;

export const useUploadHook = () => {
  const [pendingFilesListState, setPendingFilesListState] = useRecoilState(PendingFilesListState);
  const handleUploadChange = useRef<HandleUploadChangeType>(list => {
    const updatedState = list.map(f => cloneDeep(f.state));

    // Update recoil state, pending file list, etc...
    setPendingFilesListState(updatedState);
  });

  useEffect(() => {
    const current = handleUploadChange.current;

    if (current) ChatUploadService.addListener('onChange', current);

    return () => {
      ChatUploadService.removeListener('onChange', current);
    };
  }, []);

  const pauseOrResumeUpload = (id: PendingFileStateType['id']) =>
    ChatUploadService.pauseOrResume(id);

  const cancelUpload = (id: PendingFileStateType['id']) => ChatUploadService.cancel(id);

  const currentTaskFiles = (pendingFilesListState || []).filter(
    f =>
      ChatUploadService.getPendingFile(f.id).uploadTaskId === ChatUploadService.currentTaskId ||
      f.status === 'error',
  );

  const getOnePendingFile = (id: string) => ChatUploadService.getPendingFile(id);

  const tasksEnded = currentTaskFiles.every(f => f.status === 'success');

  const uploadFiles = async (list: File[]) => await ChatUploadService.upload(list);

  const uploadTaskTotalFiles = pendingFilesListState?.length || 0;
  const uploadTaskUploadedFiles =
    pendingFilesListState?.filter(f => f.status === 'success').length || 0;
  return {
    currentTaskFiles,
    tasksEnded,
    pendingFilesListState,
    pauseOrResumeUpload,
    cancelUpload,
    getOnePendingFile,
    uploadFiles,
    currentUploadTask: {
      total: uploadTaskTotalFiles,
      completed: uploadTaskUploadedFiles,
    },
  };
};
