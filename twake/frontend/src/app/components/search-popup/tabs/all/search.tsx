import Search from 'features/global/services/search-service';
import ChannelsResult from 'components/search-popup/parts/channels-result';
import UsersResult from 'components/search-popup/parts/users-result';
import MessagesResult from 'components/search-popup/parts/messages-result';
import React, { useEffect, useState } from 'react';

export default (): JSX.Element => {
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setNotFound(
      Boolean(Search.value) &&
        !Search.searchInProgress &&
        !Search.results.channels.length &&
        !Search.results.users.length &&
        !Search.results.messages.length,
    );
  }, [Search.searchInProgress, Search.value]);

  return (
    <div className="search-results">
      <div className="searchLoading">{notFound && <div>Nothing found</div>}</div>

      {((Search.results.channels.length || Search.results.users.length) && (
        <div>
          <div className="results-group-title ">Channels and contacts</div>

          {(Search.results.channels.length && (
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
          )) || <div />}

          {(Search.results.users.length && (
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
          )) || <div />}
        </div>
      )) || <div />}
      {(Search.results.messages.length && (
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
      )) || <div />}
    </div>
  );
};
