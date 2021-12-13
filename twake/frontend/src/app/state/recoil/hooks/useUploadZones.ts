import React, { useEffect } from 'react';
import FileUploadService from 'app/components/FileUploads/FileUploadService';
import { MessageFileType } from 'app/models/Message';
import { useRecoilState } from 'recoil';
import { PendingUploadZonesListState } from '../atoms/PendingUploadZonesList';
import { useUpload } from './useUpload';
import { PendingFileType } from 'app/models/File';

export const useUploadZones = (zoneId: string) => {
  const { pendingFilesListState, currentTask, getOnePendingFile } = useUpload();
  const [files, setFiles] = useRecoilState(PendingUploadZonesListState(zoneId));

  useEffect(() => {
    if (currentTask.files.length > 0) {
      const updated = files.map(f => {
        const upToDate = getOnePendingFile(f.metadata?.external_id || '');
        if (upToDate) {
          f = pendingFileToMessageFile(f, upToDate);
        }
        return f;
      });
      setFiles(updated);
    }
  }, [currentTask]);

  const upload = async (list: File[]) => {
    const newFiles = await FileUploadService.upload(list);
    setFiles([
      ...files,
      ...newFiles.map(f => {
        return {
          metadata: {
            source: 'pending',
            external_id: f.id,
          },
        };
      }),
    ]);
  };

  const clear = () => setFiles([]);

  return {
    files,
    setFiles,
    upload,
    clear,
  };
};

const pendingFileToMessageFile = (f: MessageFileType, upToDate: PendingFileType) => {
  return {
    ...f,
    company_id: upToDate.backendFile?.company_id,
    metadata: {
      ...f.metadata,
      source: upToDate.status === 'success' ? 'internal' : 'pending',
      external_id: upToDate.status === 'success' ? upToDate.backendFile?.id : upToDate.id,
      mime: upToDate.backendFile?.metadata?.mime,
      size: upToDate.backendFile?.upload_data?.size,
      name: upToDate.backendFile?.metadata?.name,
      thumbnails: upToDate.backendFile?.thumbnails,
    },
  } as MessageFileType;
};
