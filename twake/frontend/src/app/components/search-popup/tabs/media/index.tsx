import React, { useEffect } from 'react';
import Search from 'features/global/services/search-service';
import Media from 'components/search-popup/parts/media';
import NotFound from 'components/search-popup/parts/not-found';
import Loading from 'components/search-popup/parts/loading';
import Languages from 'features/global/services/languages-service';

export default (): JSX.Element => {
  useEffect(() => {}, [Search.value, Search.searchInProgress]);

  const isSearchMode = Boolean(Search.value);

  if (Search.searchInProgress) {
    return Loading();
  }

  if (
    isSearchMode &&
    !Search.searchInProgress &&
    (!Search.results.media || !Search.results.media.length)
  ) {
    return <NotFound searchString={Search.value} />;
  }

  if (Search.recent.media === undefined) {
    return <div />;
  }

  const groupTitle = isSearchMode
    ? Languages.t('components.searchpopup.media')
    : Languages.t('components.searchpopup.recent_media');

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
