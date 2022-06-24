import React from 'react';
import Search from 'features/global/services/search-service';
import Files from 'app/components/search-popup/old_parts/files';
import Media from 'app/components/search-popup/old_parts/media';
import NotFound from 'app/components/search-popup/old_parts/not-found';
import Loading from 'app/components/search-popup/old_parts/loading';
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
      splitByDates={true}
    />
  );

  return (
    <div className="search-results tab-media h-full">
      {(isSearchMode && SearchView()) || RecentView()}
    </div>
  );
};
