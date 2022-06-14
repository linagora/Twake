import React, { useEffect } from 'react';
import RecentChannelsAndContacts from 'components/search-popup/parts/recent/channels-and-contacts';
import Files from 'components/search-popup/parts/files';
import Media from 'components/search-popup/parts/media';
import Search from 'features/global/services/search-service';

export default (): JSX.Element => {
  useEffect(() => {}, []);

  return (
    <div className="search-results tab-all">
      <RecentChannelsAndContacts />
      <Files title="Recent files" files={Search.recent.files} limit={3} />
      <Media title="Recent media" files={Search.recent.media} limit={10} />
    </div>
  );
};
