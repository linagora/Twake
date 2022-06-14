import Search from 'features/global/services/search-service';
import React, { useEffect, useState } from 'react';
import ChannelsAndContacts from 'components/search-popup/parts/channels-and-contacts';
import Discussions from 'components/search-popup/parts/discussions';
import Files from 'components/search-popup/parts/files';
import Media from 'components/search-popup/parts/media';

export default (): JSX.Element => {
  const [notFound, setNotFound] = useState(false);

  if (
    Boolean(Search.value) &&
    !Search.searchInProgress &&
    !Search.results.channels.length &&
    !Search.results.users.length &&
    !Search.results.messages.length
  ) {
    return <div className="searchLoading">Nothing found</div>;
  }

  return (
    <div className="search-results">
      {((Search.results.channels?.length || Search.results.users?.length) && (
        <ChannelsAndContacts channels={Search.results.channels} users={Search.results.users} />
      )) || <div />}
      {(Search.results.messages?.length && (
        <Discussions title="Discussions" limit={4} messages={Search.results.messages} />
      )) || <div />}

      {(Search.results.files?.length && (
        <Files title="Files" limit={4} files={Search.results.files} />
      )) || <div />}
      {(Search.results.media?.length && (
        <Media title="Media" limit={4} files={Search.results.media} />
      )) || <div />}
    </div>
  );
};
