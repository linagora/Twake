import React, { useEffect } from 'react';
import RecentChannelsAndContacts from 'components/search-popup/parts/recent/channels-and-contacts';
import Files from 'components/search-popup/parts/files';
import Media from 'components/search-popup/parts/media';
import Search from 'features/global/services/search-service';
import Languages from 'features/global/services/languages-service';

export default (): JSX.Element => {
  useEffect(() => {}, []);

  return (
    <div className="search-results tab-all flex flex-col h-full overflow-y-auto">
      <RecentChannelsAndContacts />
      <Files
        title={Languages.t('components.searchpopup.recent_files')}
        files={Search.recent.files}
        limit={3}
      />
      <Media
        title={Languages.t('components.searchpopup.recent_media')}
        files={Search.recent.media}
        limit={10}
      />
    </div>
  );
};
