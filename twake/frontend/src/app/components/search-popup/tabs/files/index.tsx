import React, { useEffect, useState } from 'react';
import Search from 'features/global/services/search-service';
import PerfectScrollbar from 'react-perfect-scrollbar';
import FilesResult from 'components/search-popup/parts/recent/files-result';
import { onFileDownloadClick, onFilePreviewClick } from 'components/search-popup/parts/common';
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

  useEffect(() => {}, [Search.results.files, Search.recent.files]);

  return (
    (pageReady && (
      <div className="recent-results tab-files">
        <div className="searchLoading">{notFound && <div>Nothing found</div>}</div>

        <div className="results-group">
          {(!searchMode && <div className="results-group-title">Recent files</div>) ||
            (!notFound && !Search.searchInProgress && (
              <div className="results-group-title">Files</div>
            ))}

          <PerfectScrollbar
            options={{ suppressScrollX: true }}
            component="div"
            className="result-items-files"
          >
            {(searchMode ? Search.results.files : Search.recent.files).map(file => (
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
      </div>
    )) || <div></div>
  );
};
