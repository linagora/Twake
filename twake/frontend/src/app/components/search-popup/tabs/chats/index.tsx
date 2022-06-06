import React, { useEffect, useState } from 'react';
import Search from 'features/global/services/search-service';
import { FileType } from 'features/files/types/file';
import DriveService from 'deprecated/Apps/Drive/Drive';
import FileUploadService from 'features/files/services/file-upload-service';
import RecentChannelsAndContacts from 'components/search-popup/parts/recent-channels-and-contacts';

export default (): JSX.Element => {
  const [pageReady, setPageReady] = useState(false);

  const [searchMode, setSearchMode] = useState(false);

  const loadItems = () => Search.getFiles();

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
        <div className="results-group">
          {searchMode || <RecentChannelsAndContacts />}

          {(searchMode && (
            <div className="results-group-title">Channels and conversations</div>
          )) || <div className="results-group-title">Recent channels and conversations</div>}
        </div>
      </div>
    )) || <div />
  );
};
