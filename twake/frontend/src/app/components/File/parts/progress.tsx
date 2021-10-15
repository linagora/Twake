import React from 'react';
import { Progress } from 'antd';

import { DataFileType } from '../types';
import { PendingFileRecoilType } from 'app/models/File';
import {
  isPendingFileStatusPending,
  isPendingFileStatusPause,
  isPendingFileStatusSuccess,
  isPendingFileStatusError,
  isPendingFileStatusCancel,
} from 'app/components/FileUploads/utils/PendingFiles';

type PropsType = {
  data: DataFileType;
};

const setStatus = (status: PendingFileRecoilType['status']): 'normal' | 'exception' | 'active' => {
  switch (status) {
    case 'error':
    case 'pause':
      return 'exception';
    case 'pending':
      return 'active';
    default:
      return 'normal';
  }
};

export const FileProgress = ({ data }: PropsType): JSX.Element => {
  const setProgressStrokeColor = (): string => {
    if (!data.file.status) return '';

    if (isPendingFileStatusCancel(data.file.status)) return 'var(--error)';
    if (isPendingFileStatusError(data.file.status)) return 'var(--error)';
    if (isPendingFileStatusPause(data.file.status)) return 'var(--warning)';
    if (isPendingFileStatusPending(data.file.status)) return 'var(--progress-bar-color)';

    return 'var(--success)';
  };

  return data.file.status && !isPendingFileStatusSuccess(data.file.status) && data.file.progress ? (
    <div className="file-progress-bar-container">
      <Progress
        type="line"
        className="file-progress-bar"
        percent={data.file.progress * 100}
        showInfo={false}
        status={setStatus(data.file.status)}
        strokeColor={setProgressStrokeColor()}
        trailColor="var(--progress-bar-background)"
      />
    </div>
  ) : (
    <div className="file-progress-bar-container" />
  );
};

export default FileProgress;
