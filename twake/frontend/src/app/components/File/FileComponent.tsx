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

type PropsType = {
  className?: string;
  data: DataFileType;
};

export default ({ data, className }: PropsType) => {
  const { companyId } = RouterService.getStateFromRoute();
  const classNameArguments: Argument[] = [
    'file-component',
    className,
    {
      'file-component-error':
        data.type === 'input' &&
        data.file.status &&
        (isPendingFileStatusError(data.file.status) || isPendingFileStatusCancel(data.file.status)),
      'file-component-uploading':
        data.type === 'input' && data.file.status && !isPendingFileStatusSuccess(data.file.status),
    },
  ];

  const onClickFile = (data: DataFileType, companyId: string) =>
    DriveService.viewDocument(
      {
        id: data.file.id,
        name: data.file.name,
        url:
          data.type === 'input' // Allow instant preview even if the download is not complete
            ? data.file.thumbnail.url
            : FileUploadService.getDownloadRoute({ companyId, fileId: data.file.id }),
        extension: data.file.name.split('.').pop(),
      },
      true,
    );
  return (
    <div
      className={classNames(classNameArguments)}
      onClick={() => companyId && onClickFile(data, companyId)}
    >
      <div className="file-info-container">
        <FileThumbnail data={data} />
        <FileDetails data={data} />
        <FileActions data={data} />
      </div>
      <FileProgress data={data} />
    </div>
  );
};
