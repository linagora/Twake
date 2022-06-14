import React, { useEffect } from 'react';
import Search from 'features/global/services/search-service';
import PerfectScrollbar from 'react-perfect-scrollbar';
import FilesResult from 'components/search-popup/parts/recent/files-result';
import { onFileDownloadClick, onFilePreviewClick } from 'components/search-popup/parts/common';
import Files from 'components/search-popup/parts/files';

export default (): JSX.Element => {
  const isSearchMode = Boolean(Search.value);

  useEffect(() => {}, [Search.searchInProgress]);

  if (
    isSearchMode &&
    !Search.searchInProgress &&
    (!Search.results.files || !Search.results.files.length)
  ) {
    return <div className="searchLoading">Nothing found</div>;
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
