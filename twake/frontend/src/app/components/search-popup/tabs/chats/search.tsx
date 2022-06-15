import Search from 'features/global/services/search-service';
import React, { useEffect, useState } from 'react';
import ChannelsAndContacts from 'components/search-popup/parts/channels-and-contacts';
import Discussions from 'components/search-popup/parts/discussions';
import NotFound from 'components/search-popup/parts/not-found';
import Loading from 'components/search-popup/parts/loading';

export default (): JSX.Element => {
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {}, [Search.searchInProgress, Search.value]);

  if (Search.searchInProgress) {
    return Loading();
  }

  if (
    Boolean(Search.value) &&
    !Search.searchInProgress &&
    !Search.results.channels.length &&
    !Search.results.users.length &&
    !Search.results.messages.length
  ) {
    return <NotFound searchString={Search.value} />;
  }

  return (
    <div className="search-results">
      <div className="searchLoading">{notFound && <div>Nothing found</div>}</div>

      {((Search.results.channels.length || Search.results.users.length) && (
        <ChannelsAndContacts channels={Search.results.channels} users={Search.results.users} />
      )) || <div />}
      {(Search.results.messages.length && (
        <Discussions title="Discussions" limit={10000} messages={Search.results.messages} />
      )) || <div />}
    </div>
  );
};
