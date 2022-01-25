import React from 'react';
import { useUpload } from 'app/state/recoil/hooks/useUpload';
import FileComponent from 'app/components/file/file-component';
import { DataFileType } from 'app/components/file/types';
import { PendingFileRecoilType } from 'app/models/File';
import _ from 'lodash';
import FileUploadAPIClient from 'app/components/file-uploads/file-upload-api-client';
import { MessageFileType } from 'app/features/messages/types/message';

type PropsType = {
  file: MessageFileType;
  onRemove?: Function;
  type: 'input' | 'message';
};

export default ({ file, onRemove, type }: PropsType) => {
  const { getOnePendingFile } = useUpload();

  const id =
    (typeof file.metadata?.external_id === 'string'
      ? file.metadata?.external_id
      : file.metadata?.external_id?.id) || '';
  const companyId =
    (typeof file.metadata?.external_id === 'string'
      ? file.company_id
      : file.metadata?.external_id?.company_id) || '';

  let status: PendingFileRecoilType['status'] | undefined = 'success';
  let progress = 1;

  let formatedFile: DataFileType = {
    id: id,
    company_id: companyId,
    name: file.metadata?.name || '',
    size: file.metadata?.size || 0,
    thumbnail: FileUploadAPIClient.getFileThumbnailUrlFromMessageFile(file) || '',
    type: FileUploadAPIClient.mimeToType(file.metadata?.mime || ''),
  };

  if (file?.metadata?.source === 'pending') {
    const pendingFile = getOnePendingFile(id);
    if (!pendingFile) {
      if (onRemove) onRemove();
      return <></>;
    }
    formatedFile = {
      id: pendingFile?.backendFile?.id || '',
      company_id: pendingFile?.backendFile?.company_id || '',
      name: pendingFile.originalFile.name,
      size: pendingFile.originalFile.size,
      thumbnail: URL.createObjectURL(pendingFile.originalFile),
      type: FileUploadAPIClient.mimeToType(pendingFile.originalFile.type || ''),
    };
    status = pendingFile.status || undefined;
    progress = pendingFile.progress;
  }

  return formatedFile ? (
    <FileComponent
      className="small-right-margin small-bottom-margin"
      context={type}
      source={file.metadata?.source || 'internal'}
      externalId={file.metadata?.external_id}
      file={formatedFile}
      status={status}
      progress={progress}
      onRemove={onRemove}
    />
  ) : (
    <></>
  );
};
