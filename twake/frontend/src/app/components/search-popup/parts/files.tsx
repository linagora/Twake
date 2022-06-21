import FilesResult from 'components/search-popup/parts/recent/files-result';
import { onFileDownloadClick, onFilePreviewClick } from 'components/search-popup/parts/common';
import React from 'react';
import { FileSearchResult } from 'features/messages/types/message';

type PropsType = {
  title: string;
  files: FileSearchResult[];
  limit: number;
  showThumbnails?: boolean;
};

export default ({ files, title, limit, showThumbnails }: PropsType): JSX.Element => {
  if (!files || !files.length) {
    return <div />;
  }

  return (
    <div className="results-group flex flex-col h-full">
      <div className="results-group-title">{title}</div>

      <div className="result-items-files overflow-x-hidden overflow-y-auto">
        {files.slice(0, limit).map(file => (
          <FilesResult
            fileSearchResult={file}
            key={file.file_id}
            onPreviewClick={() => {
              onFilePreviewClick(file);
            }}
            onDownloadClick={() => {
              onFileDownloadClick(file);
            }}
            showThumbnails={showThumbnails}
          />
        ))}
      </div>
    </div>
  );
};
