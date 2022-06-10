import React, { useEffect, useState } from 'react';
import Search from 'features/global/services/search-service';
import { FileType } from 'features/files/types/file';
import DriveService from 'deprecated/Apps/Drive/Drive';
import FileUploadService from 'features/files/services/file-upload-service';
import PerfectScrollbar from 'react-perfect-scrollbar';
import FilesResult from 'components/search-popup/parts/recent/files-result';

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
    setNotFound(Boolean(Search.value) && !Search.searchInProgress && !Search.results.files.length);
  }, [Search.searchInProgress, Search.value]);

  useEffect(() => {}, [Search.results.files, Search.recent.files]);

  const onFilePreviewClick = (file: FileType) => {
    DriveService.viewDocument(
      {
        id: file.id,
        name: file.metadata.name,
        url: FileUploadService.getDownloadRoute({
          companyId: file.company_id || '',
          fileId: file.id,
        }),
        extension: file.metadata.name.split('.').pop(),
      },
      true,
    );
  };

  const onFileDownloadClick = (file: FileType) => {
    const url = FileUploadService.getDownloadRoute({
      companyId: file.company_id,
      fileId: file.id,
    });

    url && (window.location.href = url);
  };

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
                file={file}
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
