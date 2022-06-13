import React, { useEffect, useState } from 'react';
import Search from 'features/global/services/search-service';
import MediaResult from 'components/search-popup/parts/recent/media-result';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { FileType } from 'features/files/types/file';
import DriveService from 'deprecated/Apps/Drive/Drive';
import FileUploadService from 'features/files/services/file-upload-service';
import { onFilePreviewClick } from 'components/search-popup/parts/common';
import { isEmpty } from 'lodash';

export default (): JSX.Element => {
  const [pageReady, setPageReady] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setSearchMode(Boolean(Search.value));
    setPageReady(true);
  }, []);

  useEffect(() => {
    const newVal = Boolean(Search.value);
    if (searchMode !== newVal) {
      setSearchMode(newVal);
    }
  }, [Search.value]);

  useEffect(() => {
    setPageReady(!Search.searchInProgress);
    setNotFound(Boolean(Search.value) && !Search.searchInProgress && isEmpty(Search.results.media));
  }, [Search.searchInProgress, Search.value]);

  return (
    (pageReady && (
      <div className="recent-results tab-media">
        <div className="searchLoading">{notFound && <div>Nothing found</div>}</div>
        <div className="results-group">
          {(!searchMode && <div className="results-group-title">Recent media</div>) ||
            (!notFound && <div className="results-group-title">Media</div>)}

          <PerfectScrollbar
            options={{ suppressScrollX: true }}
            component="div"
            className="result-items-media"
          >
            {(searchMode ? Search.results.media : Search.recent.media).map(file => (
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
      </div>
    )) || <div />
  );
};
