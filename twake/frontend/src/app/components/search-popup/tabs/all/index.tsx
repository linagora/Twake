import PerfectScrollbar from 'react-perfect-scrollbar';
import Search from 'features/global/services/search-service';
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
    )) ||
    (Search.recentInProgress && <div className="searchLoading">loading recent...</div>) || (
      <RecentComponent />
    )
  );
};
