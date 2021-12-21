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
import Api from 'app/services/Api';

type PropsType = {
  source: 'internal' | 'drive' | string;
  externalId: string | any;
  file: DataFileType;
  context: 'input' | 'message' | 'drive';
  progress?: number;
  status?: PendingFileRecoilType['status'];
  onRemove?: Function;
  className?: string;
};

export default ({
  source,
  externalId,
  file,
  className,
  context,
  progress,
  status,
  onRemove,
}: PropsType) => {
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

  const onClickFile = async (data: DataFileType, companyId: string) => {
    if (source === 'internal') {
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
    }
    if (source === 'drive') {
      const file = (await Api.post('/ajax/drive/v2/find', {
        options: {
          element_id: externalId?.id,
          workspace_id: externalId?.workspace_id,
        },
      })) as any;
      DriveService.viewDocument(file?.data, context === 'input');
    }
  };
  return (
    <div
      className={classNames(classNameArguments)}
      onClick={() => companyId && onClickFile(file, companyId)}
    >
      <div className="file-info-container">
        <FileThumbnail file={file} />
        <FileDetails file={file} source={source} />
        <FileActions
          deletable={context === 'input'}
          actionMenu={context == 'message' && source === 'internal'}
          status={status}
          file={file}
          onRemove={onRemove}
          source={source}
        />
      </div>
      <FileProgress progress={progress} status={status} file={file} />
    </div>
  );
};
