import React from 'react';
import { useUpload } from 'app/state/recoil/hooks/useUpload';
import FileComponent from 'app/components/File/FileComponent';
import { DataFileType } from 'app/components/File/types';
import { PendingFileRecoilType } from 'app/models/File';
import _ from 'lodash';
import FileUploadAPIClient from 'app/components/FileUploads/FileUploadAPIClient';
import { MessageFileType } from 'app/models/Message';

type PropsType = {
  file: MessageFileType;
  onRemove?: Function;
};

export default ({ file, onRemove }: PropsType) => {
  const { getOnePendingFile } = useUpload();

  const id = file.metadata?.external_id || '';

  let status: PendingFileRecoilType['status'] | undefined = 'success';
  let progress = 1;

  let formatedFile: DataFileType = {
    id: id,
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
      type="input"
      file={formatedFile}
      status={status}
      progress={progress}
      onRemove={onRemove}
    />
  ) : (
    <></>
  );
};
