import React, { useEffect } from 'react';
import Search from 'features/global/services/search-service';
import Files from 'components/search-popup/parts/files';
import NotFound from 'components/search-popup/parts/not-found';
import Loading from 'components/search-popup/parts/loading';

export default (): JSX.Element => {
  const isSearchMode = Boolean(Search.value);

  useEffect(() => {}, [Search.searchInProgress]);

  if (Search.searchInProgress) {
    return Loading();
  }

  if (
    isSearchMode &&
    !Search.searchInProgress &&
    (!Search.results.files || !Search.results.files.length)
  ) {
    return <NotFound searchString={Search.value} />;
  }

  if (Search.recent.files === undefined) {
    return <div />;
  }

  const groupTitle = isSearchMode ? 'Files' : 'Recent files';

  return (
    <div className="search-results tab-files">
      <Files
        title={groupTitle}
        files={isSearchMode ? Search.results.files : Search.recent.files}
        limit={10000}
      />
    </div>
  );
};
