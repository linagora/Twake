import React from 'react';
import { FileTypes } from 'features/files/api/file-upload-api-client';
import { FileSearchResult } from 'features/messages/types/message';
import {
  FileTypeArchiveIcon,
  FileTypeDocumentIcon,
  FileTypePdfIcon,
  FileTypeSpreadsheetIcon,
  FileTypeUnknownIcon,
} from '@atoms/icons-colored';
import { DownloadIcon, EyeIcon } from '@atoms/icons-agnostic';

import { Thumbnail } from 'components/search-popup/parts/thumbnail';

const locale = navigator.languages[0];

type PropsType = {
  fileSearchResult: FileSearchResult;
  onDownloadClick: () => void;
  onPreviewClick: () => void;
  showThumbnails?: boolean;
};

const iconFileByType = (filetype: FileTypes) => {
  const iconClass = 'w-12 h-12';
  switch (filetype) {
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

export default ({
  fileSearchResult,
  onDownloadClick,
  onPreviewClick,
  showThumbnails,
}: PropsType): JSX.Element => {
  const icon = showThumbnails
    ? Thumbnail({ fileSearchResult: fileSearchResult, className: 'w-16 h-16' })
    : iconFileByType(fileSearchResult.filetype);

  if (icon === null) {
    console.error('No preview found for', fileSearchResult);
    return <div />;
  }

  let sizeStr = '';

  if (fileSearchResult.size) {
    let size = fileSearchResult.size;
    let pos = 0;
    while (size > 1024) {
      size = size / 1024;
      pos++;
    }
    sizeStr = size.toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB', 'PB'][pos];
  }

  const date = fileSearchResult.created_at
    ? new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        weekday: 'short',
        hour12: false,
      }).format(new Date(fileSearchResult.created_at))
    : '';

  const spl = fileSearchResult.filename.split('.');
  const extension = (spl.pop() || '').toUpperCase();
  const name = spl.join('.');

  return (
    <div className="result-item">
      <div className="flex items-center">{icon}</div>
      <div className="result-item-info">
        <div className="filename">{name}</div>
        <div className="details">
          {extension} <span>•</span> {sizeStr} {date && <span>•</span>} {date}
        </div>
        <div className="sender">{fileSearchResult.user.username}</div>
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
