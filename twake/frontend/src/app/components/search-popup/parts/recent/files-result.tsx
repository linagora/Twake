import React from 'react';
import FileUploadAPIClient from 'features/files/api/file-upload-api-client';
import { FileSearchResult } from 'features/messages/types/message';
import {
  FileTypeArchiveIcon,
  FileTypeDocumentIcon,
  FileTypePdfIcon,
  FileTypeSpreadsheetIcon,
  FileTypeUnknownIcon,
} from '@atoms/icons-colored';
import { DownloadIcon, EyeIcon } from '@atoms/icons-agnostic';
const locale = navigator.languages[0];

type PropsType = {
  fileSearchResult: FileSearchResult;
  onDownloadClick: () => void;
  onPreviewClick: () => void;
};

const iconFileByMime = (mimetype: string) => {
  const type = FileUploadAPIClient.mimeToType(mimetype || '');
  const iconClass = 'w-12 h-12';
  switch (type) {
    case 'pdf':
      return <FileTypePdfIcon className={iconClass} />;
    case 'archive':
      return <FileTypeArchiveIcon className={iconClass} />;
    case 'spreadsheet':
      return <FileTypeSpreadsheetIcon className={iconClass} />;
    case 'document':
      return <FileTypeDocumentIcon className={iconClass} />;
    default:
      return <FileTypeUnknownIcon className={iconClass} />;
  }
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
      <div className="flex items-center">{icon}</div>
      <div className="result-item-info">
        <div className="filename">{info.filename}</div>
        <div className="details">
          {sizeStr} {date && <span>•</span>} {date}
        </div>
        <div className="sender">{info.username}</div>
      </div>
      <div className="flex mr-1 items-center">
        <div className="px-1" onClick={onDownloadClick}>
          <DownloadIcon className="w-6 h-6 cursor-pointer fill-blue-500" />
        </div>
        <div className="px-1" onClick={onPreviewClick}>
          <EyeIcon className="w-6 h-6 cursor-pointer fill-blue-500" />
        </div>
      </div>
    </div>
  );
};
