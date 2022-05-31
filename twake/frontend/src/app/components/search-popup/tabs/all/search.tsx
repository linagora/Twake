import Search from 'features/global/services/search-service';
import ChannelsResult from 'components/search-popup/parts/channels-result';
import UsersResult from 'components/search-popup/parts/users-result';
import MessagesResult from 'components/search-popup/parts/messages-result';
import React, { useEffect, useState } from 'react';

export default (): JSX.Element => {
  const [channelsReady, setChannelsReady] = useState(false);
  const [usersReady, setUsersReady] = useState(false);
  const [messagesReady, setMessagesReady] = useState(false);
  const [searchInProgress, setSearchInProgress] = useState(false);

  useEffect(() => {
    setChannelsReady(Boolean(Search.results.channels.length));
    setUsersReady(Boolean(Search.results.users.length));
    setMessagesReady(Boolean(Search.results.messages.length));
    setSearchInProgress(Search.searchInProgress);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    Search.results.channels,
    Search.results.users,
    Search.results.messages,
    Search.searchInProgress,
  ]);

  return (
    <div className="search-results">
      <div className={'searchLoading'}>
        {(searchInProgress && <div>Searching...</div>) ||
          (!channelsReady && !usersReady && !messagesReady && <div>Nothing found</div>)}
      </div>

      {(channelsReady || usersReady) && (
        <div>
          <div className="results-group-title ">Channels and contacts</div>

          {channelsReady && (
            <div className="result-items">
              {Search.results.channels.map(channel => (
                <ChannelsResult
                  channel={channel}
                  key={channel.id}
                  highlight={Search.value}
                  onClick={() => Search.close()}
                />
              ))}
            </div>
          )}

          {usersReady && (
            <div className="result-items">
              {Search.results.users.map(user => (
                <UsersResult
                  user={user}
                  key={user.id}
                  highlight={Search.value}
                  onClick={() => Search.close()}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {messagesReady && (
        <div>
          <div className="results-group-title ">Discussions</div>
          <div className="result-items">
            {Search.results.messages.map(message => (
              <MessagesResult
                key={message.id}
                message={message}
                highlight={Search.value}
                onClick={() => Search.close()}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
