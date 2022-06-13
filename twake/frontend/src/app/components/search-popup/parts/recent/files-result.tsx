import React from 'react';
import { ChannelType } from 'features/channels/types/channel';
import { FileType } from 'features/files/types/file';
import FileUploadAPIClient from 'features/files/api/file-upload-api-client';
import { includes } from 'lodash';
import { FileSearchResult } from 'features/messages/types/message';
import Logger from 'features/global/framework/logger-service';

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
  let file: FileType;
  try {
    // @ts-ignore
    file = fileSearchResult.message.files[0];
  } catch (e) {
    Logger.getLogger('SearchPopup:FilesResult').error(e);
    console.error(fileSearchResult);
    return <div />;
  }

  const icon = iconFileByMime(file.metadata.mime);

  let sizeStr = '';

  if (file.upload_data?.size) {
    let size = file.upload_data.size;
    let pos = 0;
    while (size > 1024) {
      size = size / 1024;
      pos++;
    }
    sizeStr = size.toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB', 'PB'][pos];
  }

  let date = file.created_at
    ? new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        weekday: 'short',
        hour12: false,
      }).format(new Date(file.created_at))
    : '';

  return (
    <div className="result-item">
      <div className="result-item-icon">
        <img src={icon} />
      </div>
      <div className="result-item-info">
        <div className="filename">{file.metadata.name}</div>
        <div className="details">
          {sizeStr} {date && <span>•</span>} {date}
        </div>
        <div className="sender">{file.user?.full_name}</div>
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
