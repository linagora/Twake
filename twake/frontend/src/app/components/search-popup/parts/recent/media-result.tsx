import React from 'react';
import { FileSearchResult } from 'features/messages/types/message';
import Logger from 'features/global/framework/logger-service';
import assert from 'assert';

type PropsType = {
  fileSearchResult: FileSearchResult;
  onClick: any;
};

export default ({ fileSearchResult, onClick }: PropsType): JSX.Element => {
  let fileRoute;
  try {
    assert(fileSearchResult.message.files?.[0].metadata?.thumbnails?.[0].url);
    fileRoute = `/internal/services/files/v1${fileSearchResult.message.files?.[0].metadata?.thumbnails?.[0].url}`;
    if (window.location.hostname === 'localhost') {
      fileRoute = 'https://staging-web.twake.app' + fileRoute;
    }
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
