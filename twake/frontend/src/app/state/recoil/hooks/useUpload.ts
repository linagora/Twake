import { useEffect, useRef } from 'react';
import { cloneDeep } from 'lodash';
import FileUploadService, {
  Events as FileUploadEvents,
} from 'app/components/FileUploads/FileUploadService';

import { PendingFileType } from 'app/models/File';
import MessagePendingUploadZonesService from 'app/services/Apps/Messages/MessagePendingUploadZonesService';
import { useRecoilState, useRecoilValue } from 'recoil';
import { PendingFilesListState } from '../atoms/PendingFilesList';
import { CurrentTaskSelector } from '../selectors/CurrentTask';
import RouterServices from 'services/RouterService';

type HandleUploadChangeType = (list: PendingFileType[]) => void;

export const useUpload = () => {
  const { companyId } = RouterServices.getStateFromRoute();
  // State
  const [pendingFilesListState, setPendingFilesListState] = useRecoilState(PendingFilesListState);

  // Selector
  const currentTask = useRecoilValue(CurrentTaskSelector);

  // Handler
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
    const currentHandleUploadChange = handleUploadChange.current;

    if (currentHandleUploadChange) {
      FileUploadService.addListener(FileUploadEvents.ON_CHANGE, currentHandleUploadChange);
    }

    return () => {
      FileUploadService.removeListener(FileUploadEvents.ON_CHANGE, currentHandleUploadChange);
    };
  }, []);

  const pauseOrResumeUpload = (id: string) => FileUploadService.pauseOrResume(id);

  const cancelUpload = (id: string) => FileUploadService.cancel(id);

  const getOnePendingFile = (id: string) => FileUploadService.getPendingFile(id);

  const uploadFiles = async (editorId: string, list: File[]) =>
    await MessagePendingUploadZonesService.upload(editorId, list);

  const deleteOneFile = (id: string) => {
    if (companyId) FileUploadService.deleteOneFile({ companyId, fileId: id });
  };

  const downloadOneFile = ({
    companyId,
    fileId,
    fileName,
    blob,
  }: {
    companyId: string;
    fileId: string;
    fileName: string;
    blob?: boolean;
  }) => {
    if (blob) {
      return FileUploadService.download({ companyId, fileId });
    }

    const url = FileUploadService.getDownloadRoute({
      companyId,
      fileId,
    });

    url && (window.location.href = url);
  };

  const retryUpload = (id: string) => FileUploadService.retry(id);

  return {
    pendingFilesListState,
    pauseOrResumeUpload,
    cancelUpload,
    getOnePendingFile,
    uploadFiles,
    currentTask,
    deleteOneFile,
    downloadOneFile,
    retryUpload,
  };
};
