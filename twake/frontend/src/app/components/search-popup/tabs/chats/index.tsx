import React, { useEffect, useState } from 'react';
import Search from 'features/global/services/search-service';
import { FileType } from 'features/files/types/file';
import DriveService from 'deprecated/Apps/Drive/Drive';
import FileUploadService from 'features/files/services/file-upload-service';
import RecentChannelsAndContacts from 'components/search-popup/parts/recent-channels-and-contacts';

export default (): JSX.Element => {
  const [pageReady, setPageReady] = useState(false);

  const [searchMode, setSearchMode] = useState(false);

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
