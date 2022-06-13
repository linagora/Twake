import React, { useEffect } from 'react';
import Search from 'features/global/services/search-service';
import FilesResult from 'components/search-popup/parts/recent/files-result';
import MediaResult from 'components/search-popup/parts/recent/media-result';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { FileType } from 'features/files/types/file';
import DriveService from 'deprecated/Apps/Drive/Drive';
import FileUploadService from 'features/files/services/file-upload-service';
import RecentChannelsAndContacts from 'components/search-popup/parts/recent-channels-and-contacts';
import { FileSearchResult, MessageFileType } from 'features/messages/types/message';
import Logger from 'features/global/framework/logger-service';
import assert from 'assert';
import { onFileDownloadClick, onFilePreviewClick } from 'components/search-popup/parts/common';

export default (): JSX.Element => {
  useEffect(() => {}, []);

  // let logger = Logger.getLogger('SearchPopup:TabsRecent');

  return (
    <div className="recent-results tab-all">
      {<RecentChannelsAndContacts />}

      {(Search.recent.files.length && (
        <div className="results-group">
          <div className="results-group-title">Recent files</div>

          <PerfectScrollbar
            options={{ suppressScrollX: true }}
            component="div"
            className="result-items-files"
          >
            {Search.recent.files.slice(0, 8).map(file => (
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
      )) || <div />}

      {(Search.recent.media.length && (
        <div className="results-group">
          <div className="results-group-title">Recent media</div>

          <PerfectScrollbar
            options={{ suppressScrollY: true }}
            component="div"
            className="result-items-media"
          >
            {Search.recent.media.slice(0, 7).map(file => (
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
      )) || <div />}
    </div>
  );
};
