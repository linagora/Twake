import React, { useEffect, useState } from 'react';
import Search from 'features/global/services/search-service';
import ChannelsResult from 'components/search-popup/parts/recent/channels-result';
import FilesResult from 'components/search-popup/parts/recent/files-result';
import MediaResult from 'components/search-popup/parts/recent/media-result';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { FileType } from 'features/files/types/file';
import { ChannelType } from 'features/channels/types/channel';

export default (): JSX.Element => {
  const [channelsReady, setChannelsReady] = useState(false);
  const [filesReady, setFilesReady] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);

  useEffect(() => {
    Search.getRecent().then(() => console.log('!!! got all recent', Search.recent.channels));
  }, []);

  useEffect(() => {
    setChannelsReady(Boolean(Search.recent.channels.length));
  }, [Search.recent.channels.length]);

  useEffect(() => {
    setFilesReady(Boolean(Search.recent.files.length));
  }, [Search.recent.files.length]);

  useEffect(() => {
    setMediaReady(Boolean(Search.recent.media.length));
  }, [Search.recent.media.length]);

  const onChanelClick = (channel: ChannelType) => {
    console.log('!!!channel', channel);
    Search.close();
  };

  const onFilePreviewClick = (file: FileType) => {
    console.log('!!!preview', file);
    Search.close();
  };

  const onFileDownloadClick = (file: FileType) => {
    console.log('!!!download', file);
    Search.close();
  };

  return (
    <div className="recent-results">
      {channelsReady && (
        <div className="results-group">
          <div className="results-group-title">Channels and contacts</div>

          <PerfectScrollbar
            options={{ suppressScrollY: true }}
            component="div"
            className="result-items-channel"
          >
            {Search.recent.channels.map(channel => (
              <ChannelsResult
                channel={channel}
                key={channel.id}
                onClick={() => {
                  onChanelClick(channel);
                }}
              />
            ))}
          </PerfectScrollbar>
        </div>
      )}

      {filesReady && (
        <div className="results-group">
          <div className="results-group-title">Recent files</div>

          <PerfectScrollbar
            options={{ suppressScrollX: true }}
            component="div"
            className="result-items-files"
          >
            {Search.recent.files.map(file => (
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
      )}

      {mediaReady && (
        <div className="results-group">
          <div className="results-group-title">Recent media</div>

          <PerfectScrollbar
            options={{ suppressScrollY: true }}
            component="div"
            className="result-items-media"
          >
            {Search.recent.media.map(file => (
              <MediaResult
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
      )}
    </div>
  );
};
