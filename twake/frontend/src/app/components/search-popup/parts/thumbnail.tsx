import { FileSearchResult } from 'app/features/messages/types/message';
import FileType from 'components/drive/ui/file-type';
import React from 'react';

type PropsType = {
  className: string;
  file?: FileType;
  fileSearchResult?: FileSearchResult;
};

export const Thumbnail = ({ file, fileSearchResult, className }: PropsType): JSX.Element | null => {
  let fileRoute = null;

  if (fileSearchResult) {
    fileRoute = fileSearchResult.thumbnail_url;
  }

  if (!fileRoute) {
    return null;
  }

  return (
    <img
      className={'object-cover rounded-lg ' + className}
      src={fileRoute}
      style={{ maxWidth: 'none' }}
    />
  );
};
