import React from 'react';
import { Image } from 'antd';
import classNames from 'classnames';
import { FileText, Film } from 'react-feather';

import { DataFileType } from '../types';

type PropsType = {
  file: DataFileType;
};

export const FileThumbnail = ({ file }: PropsType): JSX.Element => {
  const type = file.type.split('/')[0];
  const isImageType = type === 'image';
  const isVideoType = type === 'video';

  return (
    <div className={classNames('file-thumbnail-container', 'small-right-margin')}>
      {isImageType ? (
        <Image
          width={32}
          height={32}
          className="file-thumbnail-component"
          preview={false}
          src={file.thumbnail}
        />
      ) : (
        <></>
      )}
      {isVideoType ? <Film size={20} /> : <></>}
      {!isImageType && !isVideoType ? <FileText size={20} /> : <></>}
    </div>
  );
};

export default FileThumbnail;
