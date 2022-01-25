import React, { useState, useEffect } from 'react';
import classNames, { Argument } from 'classnames';

import { FileThumbnail, FileDetails, FileActions, FileProgress } from './parts';
import {
  isPendingFileStatusCancel,
  isPendingFileStatusError,
  isPendingFileStatusSuccess,
} from 'app/components/file-uploads/utils/pending-files';
import { DataFileType } from './types';
import DriveService from 'services/Apps/Drive/Drive.js';
import FileUploadService from '../file-uploads/file-upload-service';
import RouterService from 'app/features/router/services/router-service';

import './file.scss';
import { PendingFileRecoilType } from 'app/models/File';
import Api from 'app/services/Api';
import FileUploadAPIClient from '../file-uploads/file-upload-api-client';

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
  file: _file,
  className,
  context,
  progress,
  status,
  onRemove,
}: PropsType) => {
  const { companyId, workspaceId } = RouterService.getStateFromRoute();
  const [file, setFile] = useState<DataFileType>(_file);
  const classNameArguments: Argument[] = [
    'file-component',
    className,
    {
      'file-component-error':
        status && (isPendingFileStatusError(status) || isPendingFileStatusCancel(status)),
      'file-component-uploading': progress && progress < 1,
    },
  ];

  useEffect(() => {
    if (source === 'drive') {
      (async () => {
        if (typeof externalId === 'string') {
          externalId = { id: externalId, workspace_id: workspaceId };
        }

        let driveFile = (await Api.post('/ajax/drive/v2/find', {
          options: {
            element_id: externalId?.id,
            workspace_id: externalId?.workspace_id,
          },
        })) as any;
        driveFile = driveFile?.data || {};

        setFile({
          ...file,
          thumbnail: driveFile.preview_link,
          name: driveFile.name,
          size: driveFile.size,
          type: FileUploadAPIClient.mimeToType(
            FileUploadAPIClient.extensionToMime(driveFile.extension),
          ),
        });
      })();
    }
  }, []);

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
      if (typeof externalId === 'string') {
        externalId = { id: externalId, workspace_id: workspaceId };
      }

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
