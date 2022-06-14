import React from 'react';
import { FileType } from 'features/files/types/file';
import { FileSearchResult } from 'features/messages/types/message';
import Logger from 'features/global/framework/logger-service';
import {
  getFileMessageDownloadRoute,
} from 'components/search-popup/parts/common';
import assert from 'assert';

type PropsType = {
  fileSearchResult: FileSearchResult;
  onClick: any;
};

export default ({ fileSearchResult, onClick }: PropsType): JSX.Element => {
  let fileRoute;
  try {
    assert(fileSearchResult.message.files?.[0], JSON.stringify(fileSearchResult.message));
    fileRoute = getFileMessageDownloadRoute(fileSearchResult.message.files?.[0]);
  } catch (e) {
    Logger.getLogger('SearchPopup:MediaResult').error(e);
    console.error(fileSearchResult);
    return <div />;
  }

  return (
    <div className="result-item" onClick={onClick}>
      <img src={fileRoute} />
    </div>
  );
};
