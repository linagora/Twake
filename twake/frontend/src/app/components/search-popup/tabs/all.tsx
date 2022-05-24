import PerfectScrollbar from 'react-perfect-scrollbar';
import Search from 'features/global/services/search-service';
import ChannelsResult from 'components/search-popup/parts/channels-result';
import UsersResult from 'components/search-popup/parts/users-result';
import MessagesResult from 'components/search-popup/parts/messages-result';
import React from 'react';

type PropsType = { scroller: any };

export default ({ scroller }: PropsType): JSX.Element => {
  return (
    <PerfectScrollbar
      options={{ suppressScrollX: true }}
      component="div"
      className="search-results"
      containerRef={node => {
        scroller = node;
      }}
    >
      {(Boolean(Search.results.channels.length) || Boolean(Search.results.users.length)) && (
        <div>
          <div className="results-group-title ">Channels and contacts</div>

          {Boolean(Search.results.channels.length) && (
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

          {Boolean(Search.results.users.length) && (
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

      {Boolean(Search.results.messages.length) && (
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
    </PerfectScrollbar>
  );
};
