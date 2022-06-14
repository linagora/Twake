import React, { useEffect } from 'react';
import Search from 'features/global/services/search-service';
import MediaResult from 'components/search-popup/parts/recent/media-result';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { onFilePreviewClick } from 'components/search-popup/parts/common';
import Media from 'components/search-popup/parts/media';

export default (): JSX.Element => {
  useEffect(() => {}, [Search.value, Search.searchInProgress]);

  const isSearchMode = Boolean(Search.value);

  if (
    isSearchMode &&
    !Search.searchInProgress &&
    (!Search.results.media || !Search.results.media.length)
  ) {
    return <div className="searchLoading">Nothing found</div>;
  }

  if (Search.recent.media === undefined) {
    return <div />;
  }

  const groupTitle = isSearchMode ? 'Media' : 'Recent media';

  return (
    <div className="search-results tab-media">
      <Media
        title={groupTitle}
        files={isSearchMode ? Search.results.media : Search.recent.media}
        limit={10000}
      />
    </div>
  );
};
