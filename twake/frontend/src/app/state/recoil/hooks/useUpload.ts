import FileUploadService from 'app/components/file-uploads/file-upload-service';
import { useRecoilState, useRecoilValue } from 'recoil';
import { PendingFilesListState } from '../atoms/PendingFilesList';
import { CurrentTaskSelector } from '../selectors/CurrentTask';
import RouterServices from 'services/RouterService';

export const useUpload = () => {
  const { companyId } = RouterServices.getStateFromRoute();
  const [pendingFilesListState, setPendingFilesListState] = useRecoilState(PendingFilesListState);
  FileUploadService.setRecoilHandler(setPendingFilesListState);

  const currentTask = useRecoilValue(CurrentTaskSelector);

  const pauseOrResumeUpload = (id: string) => FileUploadService.pauseOrResume(id);

  const cancelUpload = (id: string) => FileUploadService.cancel(id);

  const getOnePendingFile = (id: string) => FileUploadService.getPendingFile(id);

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
    currentTask,
    deleteOneFile,
    downloadOneFile,
    retryUpload,
  };
};
