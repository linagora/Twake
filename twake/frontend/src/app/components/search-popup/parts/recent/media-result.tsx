import React from 'react';
import { FileType } from 'features/files/types/file';
import FileUploadService from 'features/files/services/file-upload-service';
import assert from 'assert';
import FileThumbnail from '../../../file/parts/thumbnail';

type PropsType = {
  file: FileType;
  onClick: any;
};

export default ({ file, onClick }: PropsType): JSX.Element => {
  let fileRoute = file.thumbnails[0].url;
  return (
    <div className="result-item" onClick={onClick}>
      <img src={fileRoute} />
    </div>
  );
};
