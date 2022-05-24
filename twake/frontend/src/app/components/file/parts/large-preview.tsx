import React from 'react';
import { DataFileType } from '../types';
import { Play } from 'react-feather';

type PropsType = {
  file: DataFileType;
};

const LargePreview = ({ file: { thumbnail, type } }: PropsType): JSX.Element => {
  return (
    <div
      className="file-large-preview"
      style={{
        backgroundImage: `url(${thumbnail})`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {type === 'video' && <Play size={32} />}
    </div>
  );
};

export default LargePreview;
