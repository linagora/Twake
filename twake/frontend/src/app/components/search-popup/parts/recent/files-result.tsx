import React from 'react';
import FileUploadAPIClient from 'features/files/api/file-upload-api-client';
import { FileSearchResult } from 'features/messages/types/message';

const locale = navigator.languages[0];

type PropsType = {
  fileSearchResult: FileSearchResult;
  onDownloadClick: any;
  onPreviewClick: any;
};

const iconFileByMime = (mimetype: string) => {
  const type = FileUploadAPIClient.mimeToType(mimetype || '');
  const existedIcons = ['pdf', 'archive', 'spreadsheet', 'document'];
  return `/public/icons/file-type-${existedIcons.includes(type) ? type : 'unknown'}.svg`;
};

export default ({ fileSearchResult, onDownloadClick, onPreviewClick }: PropsType): JSX.Element => {
  const info = {
    mime: fileSearchResult.metadata?.mime || '',
    size: fileSearchResult.metadata?.size,
    created_at: fileSearchResult.created_at,
    filename: fileSearchResult.metadata?.name,
    username: fileSearchResult.user.full_name,
  };

  const icon = iconFileByMime(info.mime);

  let sizeStr = '';

  if (info.size) {
    let size = info.size;
    let pos = 0;
    while (size > 1024) {
      size = size / 1024;
      pos++;
    }
    sizeStr = size.toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB', 'PB'][pos];
  }

  const date = info.created_at
    ? new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        weekday: 'short',
        hour12: false,
      }).format(new Date(info.created_at))
    : '';

  return (
    <div className="result-item">
      <div className="result-item-icon">
        <img src={icon} />
      </div>
      <div className="result-item-info">
        <div className="filename">{info.filename}</div>
        <div className="details">
          {sizeStr} {date && <span>•</span>} {date}
        </div>
        <div className="sender">{info.username}</div>
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
