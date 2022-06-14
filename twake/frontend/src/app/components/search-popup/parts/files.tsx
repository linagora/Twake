import PerfectScrollbar from 'react-perfect-scrollbar';
import FilesResult from 'components/search-popup/parts/recent/files-result';
import { onFileDownloadClick, onFilePreviewClick } from 'components/search-popup/parts/common';
import React from 'react';
import { FileSearchResult } from 'features/messages/types/message';

type PropsType = {
  title: string;
  files: FileSearchResult[];
  limit: number;
};

export default ({ files, title, limit }: PropsType): JSX.Element => {
  if (!files || !files.length) {
    return <div />;
  }

  return (
    <div className="results-group">
      <div className="results-group-title">{title}</div>

      <PerfectScrollbar
        options={{ suppressScrollX: true }}
        component="div"
        className="result-items-files"
      >
        {files.slice(0, limit).map(file => (
          <FilesResult
            fileSearchResult={file}
            key={file.id}
            onPreviewClick={() => {
              onFilePreviewClick(file);
            }}
            onDownloadClick={() => {
              onFileDownloadClick(file);
            }}
          />
        ))}
      </PerfectScrollbar>
    </div>
  );
};
