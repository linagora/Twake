import React from 'react';
import classNames, { Argument } from 'classnames';

import { FileThumbnail, FileDetails, FileActions, FileProgress } from './parts';
import {
  isPendingFileStatusCancel,
  isPendingFileStatusError,
  isPendingFileStatusSuccess,
} from 'app/components/FileUploads/utils/PendingFiles';
import { DataFileType } from './types';
import DriveService from 'services/Apps/Drive/Drive.js';
import FileUploadService from '../FileUploads/FileUploadService';
import RouterService from 'app/services/RouterService';

import './File.scss';
import { PendingFileRecoilType } from 'app/models/File';

type PropsType = {
  className?: string;
  file: DataFileType;
  type: 'input' | 'message' | 'drive';
  progress?: number;
  status?: PendingFileRecoilType['status'];
  onRemove?: Function;
};

export default ({ file, className, type, progress, status, onRemove }: PropsType) => {
  const { companyId } = RouterService.getStateFromRoute();
  const classNameArguments: Argument[] = [
    'file-component',
    className,
    {
      'file-component-error':
        status && (isPendingFileStatusError(status) || isPendingFileStatusCancel(status)),
      'file-component-uploading': progress && progress < 1,
    },
  ];

  const onClickFile = (data: DataFileType, companyId: string) => {
    //Only if upload has ended
    if (!status || isPendingFileStatusSuccess(status))
      DriveService.viewDocument(
        {
          id: file.id,
          name: file.name,
          url: FileUploadService.getDownloadRoute({ companyId, fileId: file.id }),
          extension: file.name.split('.').pop(),
        },
        true,
      );
  };
  return (
    <div
      className={classNames(classNameArguments)}
      onClick={() => companyId && onClickFile(file, companyId)}
    >
      <div className="file-info-container">
        <FileThumbnail file={file} />
        <FileDetails file={file} />
        <FileActions
          deletable={type === 'input'}
          actionMenu={type == 'message'}
          status={status}
          file={file}
          onRemove={onRemove}
        />
      </div>
      <FileProgress progress={progress} status={status} file={file} />
    </div>
  );
};
