import Search from 'features/global/services/search-service';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { onFilePreviewClick } from 'components/search-popup/parts/common';
import React from 'react';
import MediaResult from 'components/search-popup/parts/recent/media-result';
import { FileSearchResult } from 'features/messages/types/message';

type PropsType = {
  title: string;
  files: FileSearchResult[];
  limit: number;
};

export default ({ title, files, limit }: PropsType): JSX.Element => {
  if (!files || !files.length) {
    return <div />;
  }

  return (
    <div className="results-group">
      <div className="results-group-title">{title}</div>

      <PerfectScrollbar
        options={{ suppressScrollY: true }}
        component="div"
        className="result-items-media"
      >
        {files.slice(0, limit).map(file => (
          <MediaResult
            fileSearchResult={file}
            key={file.id}
            onClick={() => {
              onFilePreviewClick(file);
            }}
          />
        ))}
      </PerfectScrollbar>
    </div>
  );
};
