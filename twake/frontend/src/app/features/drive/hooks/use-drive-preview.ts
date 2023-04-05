import fileUploadApiClient from 'app/features/files/api/file-upload-api-client';
import fileUploadService from 'app/features/files/services/file-upload-service';
import { useGlobalEffect } from 'app/features/global/hooks/use-global-effect';
import { LoadingState } from 'app/features/global/state/atoms/Loading';
import { useRecoilState } from 'recoil';
import { DriveApiClient } from '../api-client/api-client';
import { DriveViewerState } from '../state/viewer';
import { DriveItem } from '../types';

export const useDrivePreviewModal = () => {
  const [status, setStatus] = useRecoilState(DriveViewerState);

  const open: (item: DriveItem) => void = (item: DriveItem) => {
    if (
      !item.last_version_cache?.file_metadata?.source ||
      item.last_version_cache?.file_metadata?.source === 'internal'
    ) {
      setStatus({ item, loading: true });
    }
  };

  const close = () => setStatus({ item: null, loading: true });

  return { open, close, isOpen: !!status.item };
};

export const useDrivePreview = () => {
  const [status, setStatus] = useRecoilState(DriveViewerState);
  const modal = useDrivePreviewModal();

  useGlobalEffect(
    'useDrivePreview',
    async () => {
      if (modal.isOpen && status.item) {
        setStatus({
          ...status,
          loading: true,
        });

        const details = await DriveApiClient.get(status.item.company_id, status.item.id);

        setStatus({
          ...status,
          details,
          loading: false,
        });
      }
    },
    [status.item?.id],
  );

  return {
    ...modal,
    status,
    loading: status.loading,
  };
};

export const useDrivePreviewLoading = () => {
  const [loading, setLoading] = useRecoilState(LoadingState('useDrivePreviewLoading'));

  return { loading, setLoading };
};

export const useDrivePreviewDisplayData = () => {
  const { status } = useDrivePreview();

  if (!status) {
    return {};
  }

  const name =
    status.details?.item.last_version_cache.file_metadata.name || status.details?.item.name || '';
  const extension = name.split('.').pop();
  const type = fileUploadApiClient.mimeToType(
    status.details?.item.last_version_cache.file_metadata.mime || '',
    extension,
  );
  const id = status.details?.item.last_version_cache.file_metadata.external_id || '';
  const download = fileUploadService.getDownloadRoute({
    companyId: status.item?.company_id || '',
    fileId: status.details?.item.last_version_cache.file_metadata.external_id || '',
  });

  return { download, id, name, type, extension };
};
