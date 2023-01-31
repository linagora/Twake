import { useGlobalEffect } from 'app/features/global/hooks/use-global-effect';
import { MessageFileType } from 'app/features/messages/types/message';
import ViewerAPIClient, { DriveFileDetails, MessageFileDetails } from '../api/viewer-api-client';
import { atom, useRecoilState } from 'recoil';
import FileUploadApiClient from 'app/features/files/api/file-upload-api-client';
import FileUploadService from 'app/features/files/services/file-upload-service';
import { LoadingState } from 'app/features/global/state/atoms/Loading';
import UserAPIClient from 'app/features/users/api/user-api-client';

export const FileViewerState = atom<{
  file: null | { company_id?: string; message_id?: string; id?: string };
  details?: MessageFileDetails | DriveFileDetails;
  loading: boolean;
}>({
  key: 'FileViewerState',
  default: {
    file: null,
    details: undefined,
    loading: true,
  },
});

export const useFileViewerModal = () => {
  const [status, setStatus] = useRecoilState(FileViewerState);

  return {
    open: (file: MessageFileType) => {
      if (file.metadata?.source === 'internal') setStatus({ file, loading: true });
    },
    close: () => setStatus({ file: null, loading: true }),
    isOpen: !!status?.file,
  };
};

export const useFileViewer = () => {
  const [status, setStatus] = useRecoilState(FileViewerState);
  const modal = useFileViewerModal();

  useGlobalEffect(
    'useFileViewer',
    async () => {
      if (modal.isOpen && status.file) {
        setStatus({
          ...status,
          loading: true,
        });

        if (status.file.message_id) {
          const details = await ViewerAPIClient.getMessageFile(
            status.file.company_id || '',
            status.file.message_id || '',
            status.file.id || '',
          );

          setStatus({
            ...status,
            details: details.resource || (details as unknown as MessageFileDetails),
            loading: false,
          });
        } else {
          const details = await ViewerAPIClient.getPublicFile(
            status.file.company_id || '',
            status.file.id || '',
          );

          const user = (await UserAPIClient.list([details.resource.user_id])).pop();
          
          setStatus({
            ...status,
            details: {
              ...status.file,
              ...details.resource,
              user
            },
            loading: false,
          });
        }
      }
    },
    [status.file?.id],
  );

  return {
    ...modal,
    status,
    loading: status.loading,
    next: () => {
      if (status.details?.navigation?.next && !status.loading)
        setStatus({
          ...status,
          file: {
            company_id: status.file?.company_id || '',
            message_id: status.details?.navigation.next?.message_id,
            id: status.details?.navigation.next?.id,
          },
        });
    },
    previous: () => {
      if (status.details?.navigation?.previous && !status.loading)
        setStatus({
          ...status,
          file: {
            company_id: status.file?.company_id || '',
            message_id: status.details?.navigation.previous?.message_id,
            id: status.details?.navigation.previous?.id,
          },
        });
    },
  };
};

export const useViewerDataLoading = () => {
  const [loading, setLoading] = useRecoilState(LoadingState('useViewerDataLoading'));
  return { loading, setLoading };
};

export const useViewerDisplayData = () => {
  const { status } = useFileViewer();

  if (!status) {
    return {};
  }

  const name = status?.details?.metadata?.name || '';
  const extension = name?.split('.').pop();

  const download = FileUploadService.getDownloadRoute({
    companyId:
      (status?.details as MessageFileDetails)?.metadata?.external_id?.company_id ||
      status.file?.company_id,
    fileId: (status?.details as MessageFileDetails)?.metadata?.external_id?.id || status.file?.id,
  });

  const type = FileUploadApiClient.mimeToType(status?.details?.metadata?.mime || '', extension);

  const id = (status?.details as MessageFileDetails)?.metadata?.external_id?.id || status.file?.id;

  return { download, type, name, id };
};
