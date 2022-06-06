import React, { useEffect, useState } from 'react';
import Search from 'features/global/services/search-service';
import MediaResult from 'components/search-popup/parts/recent/media-result';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { FileType } from 'features/files/types/file';
import DriveService from 'deprecated/Apps/Drive/Drive';
import FileUploadService from 'features/files/services/file-upload-service';

export default (): JSX.Element => {
  const [pageReady, setPageReady] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  const loadItems = () => Search.getMedia();

  useEffect(() => {
    setSearchMode(Boolean(Search.value));
    setPageReady(true);
  }, []);

  useEffect(() => {
    const newVal = Boolean(Search.value);
    if (searchMode !== newVal) {
      setSearchMode(newVal);
      loadItems();
    }
  }, [Search.value]);

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

  const onMediaClick = (file: FileType) => {
    onFilePreviewClick(file);
  };

  return (
    (pageReady && (
      <div className="recent-results tab-media">
        <div className="results-group">
          <div className="results-group-title">Recent media</div>

          <PerfectScrollbar
            options={{ suppressScrollX: true }}
            component="div"
            className="result-items-media"
          >
            {Search.recent.media.map(file => (
              <MediaResult
                file={file}
                key={file.id}
                onClick={() => {
                  onMediaClick(file);
                }}
              />
            ))}
          </PerfectScrollbar>
        </div>
      </div>
    )) || <div />
  );
};
