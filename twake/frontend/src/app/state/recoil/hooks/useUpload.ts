import FileUploadService, {
  Events as FileUploadEvents,
} from 'app/components/FileUploads/FileUploadService';
import { PendingFileType } from 'app/models/File';
import MessagePendingUploadZonesService from 'app/services/Apps/Messages/MessagePendingUploadZonesService';
import { cloneDeep } from 'lodash';
import { useEffect, useRef } from 'react';
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
    await MessagePendingUploadZonesService.add(editorId, list);

  const deleteOneFile = (id: string) => {
    if (companyId) FileUploadService.deleteOneFile({ companyId, fileId: id });
  };

  return {
    pendingFilesListState,
    pauseOrResumeUpload,
    cancelUpload,
    getOnePendingFile,
    uploadFiles,
    currentTask,
    deleteOneFile,
  };
};
