import Search from 'features/global/services/search-service';
import React from 'react';
import ChannelsAndContacts from 'app/components/search-popup/old_parts/channels-and-contacts';
import Discussions from 'app/components/search-popup/old_parts/discussions';
import Files from 'app/components/search-popup/old_parts/files';
import Media from 'app/components/search-popup/old_parts/media';
import Languages from 'features/global/services/languages-service';
import NotFound from 'app/components/search-popup/old_parts/not-found';
import Loading from 'app/components/search-popup/old_parts/loading';

export default (): JSX.Element => {
  if (Search.searchInProgress) {
    return Loading();
  }

  if (
    Boolean(Search.value) &&
    !Search.searchInProgress &&
    !Search.results.channels.length &&
    !Search.results.users.length &&
    !Search.results.messages.length &&
    !Search.results.files.length
  ) {
    return <NotFound searchString={Search.value} />;
  }

  return (
    <div className="search-results">
      {((Search.results.channels?.length || Search.results.users?.length) && (
        <ChannelsAndContacts channels={Search.results.channels} users={Search.results.users} />
      )) || <div />}
      {(Search.results.messages?.length && (
        <Discussions
          title={Languages.t('components.searchpopup.chats')}
          limit={4}
          messages={Search.results.messages}
        />
      )) || <div />}

      {(Search.results.files?.length && (
        <Files
          title={Languages.t('components.searchpopup.files')}
          limit={4}
          files={Search.results.files}
        />
      )) || <div />}
      {(Search.results.media?.length && (
        <Media
          title={Languages.t('components.searchpopup.media')}
          limit={4}
          files={Search.results.media}
        />
      )) || <div />}
    </div>
  );
};
