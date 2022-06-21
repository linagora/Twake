import React from 'react';
import Search from 'features/global/services/search-service';
import Files from 'components/search-popup/parts/files';
import Media from 'components/search-popup/parts/media';
import NotFound from 'components/search-popup/parts/not-found';
import Loading from 'components/search-popup/parts/loading';
import Languages from 'features/global/services/languages-service';

export default (): JSX.Element => {
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

  const SearchView = () => (
    <Files
      title={Languages.t('components.searchpopup.media')}
      files={Search.results.media}
      limit={10000}
      showThumbnails={true}
    />
  );

  const RecentView = () => (
    <Media
      title={Languages.t('components.searchpopup.recent_media')}
      files={isSearchMode ? Search.results.media : Search.recent.media}
      limit={10000}
    />
  );

  return (
    <div className="search-results tab-media h-full">
      {(isSearchMode && SearchView()) || RecentView()}
    </div>
  );
};
