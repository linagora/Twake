import PerfectScrollbar from 'react-perfect-scrollbar';
import Search from 'features/global/services/search-service';
import ChannelsResult from 'components/search-popup/parts/channels-result';
import UsersResult from 'components/search-popup/parts/users-result';
import MessagesResult from 'components/search-popup/parts/messages-result';
import React from 'react';
import SearchComponent from './search';
import RecentComponent from './recent';

type PropsType = { scroller: any };

export default ({ scroller }: PropsType): JSX.Element => {
  return (
    (Search.value && (
      <PerfectScrollbar
        options={{ suppressScrollX: true }}
        component="div"
        className="search-results"
        containerRef={node => {
          scroller = node;
        }}
      >
        <SearchComponent />
      </PerfectScrollbar>
    )) || <RecentComponent />
  );
};
