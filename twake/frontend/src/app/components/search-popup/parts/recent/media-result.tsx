import React from 'react';
import { FileType } from 'features/files/types/file';

type PropsType = {
  file: FileType;
  onClick: any;
};

export default ({ file, onClick }: PropsType): JSX.Element => {
  let fileRoute = file.thumbnails[0].url;
  if (window.location.hostname === 'localhost') fileRoute = 'https://web.qa.twake.app' + fileRoute; // TODO: REMOVE
  return (
    <div className="result-item" onClick={onClick}>
      <img src={fileRoute} />
    </div>
  );
};
