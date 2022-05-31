import React from 'react';
import { ChannelType } from 'features/channels/types/channel';
import { FileType } from 'features/files/types/file';

type PropsType = {
  file: FileType;
  onDownloadClick: any;
  onPreviewClick: any;
};

const iconFileByMime = (mimetype: string) => {
  if (~mimetype.indexOf('spreadsheetml')) {
    return '/public/icons/file-type-xls.svg';
  }
  if (~mimetype.indexOf('msword')) {
    return '/public/icons/file-type-doc.svg';
  }
  if (~mimetype.indexOf('pdf')) {
    return '/public/icons/file-type-pdf.svg';
  }

  return '';
};

export default ({ file, onDownloadClick, onPreviewClick }: PropsType): JSX.Element => {
  const icon = iconFileByMime(file.metadata.mime);

  return (
    <div className="result-item">
      <div className="result-item-icon">
        <img src={icon} />
      </div>
      <div className="result-item-info">
        <div className="filename">{file.metadata.name}</div>
        <div className="details">104 KB • Dec7,2021 at 13:31 </div>
        <div className="sender">Diana Potokina</div>
      </div>
      <div className="result-item-actions">
        <div className="result-item-icon" onClick={onDownloadClick}>
          <img src="/public/icons/download.svg" />
        </div>
        <div className="result-item-icon" onClick={onPreviewClick}>
          <img src="/public/icons/eye.svg" />
        </div>
      </div>
    </div>
  );
};
