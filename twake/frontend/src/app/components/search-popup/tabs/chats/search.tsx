import Search from 'features/global/services/search-service';
import React, { useEffect } from 'react';
import ChannelsAndContacts from 'components/search-popup/parts/channels-and-contacts';
import Discussions from 'components/search-popup/parts/discussions';
import NotFound from 'components/search-popup/parts/not-found';
import Loading from 'components/search-popup/parts/loading';
import Languages from 'features/global/services/languages-service';

export default (): JSX.Element => {
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
      {((Search.results.channels.length || Search.results.users.length) && (
        <ChannelsAndContacts channels={Search.results.channels} users={Search.results.users} />
      )) || <div />}
      {(Search.results.messages.length && (
        <Discussions
          title={Languages.t('components.searchpopup.chats')}
          limit={10000}
          messages={Search.results.messages}
        />
      )) || <div />}
    </div>
  );
};
