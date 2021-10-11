import React from 'react';
import { FileThumbnail, FileDetails, FileActions, FileProgress } from './parts';
import classNames from 'classnames';
import { isPendingFileStatusSuccess } from 'app/components/FileUploads/utils/PendingFiles';
import { DataFileType } from './types';
import './File.scss';

type PropsType = {
  className?: string;
  data: DataFileType;
};

const onClickFile = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  // TODO preview document here
  console.log('onClickFile', e);
};

export default ({ data, className }: PropsType) => (
  <div
    className={classNames('file-component', className, {
      'file-component-uploading':
        data.type === 'input' && data.file.status && !isPendingFileStatusSuccess(data.file.status),
    })}
    onClick={onClickFile}
  >
    <div className="file-info-container">
      <FileThumbnail data={data} />
      <FileDetails data={data} />
      <FileActions data={data} />
    </div>
    <FileProgress data={data} />
  </div>
);
