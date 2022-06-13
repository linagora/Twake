import React from 'react';
import { FileType } from 'features/files/types/file';
import { FileSearchResult } from 'features/messages/types/message';
import Logger from 'features/global/framework/logger-service';

type PropsType = {
  fileSearchResult: FileSearchResult;
  onClick: any;
};

export default ({ fileSearchResult, onClick }: PropsType): JSX.Element => {
  let fileRoute;
  try {
    fileRoute = fileSearchResult.message.files?.[0].metadata?.thumbnails?.[0].url;
  } catch (e) {
    Logger.getLogger('SearchPopup:MediaResult').error(e);
    console.error(fileSearchResult);
    return <div />;
  }

  if (window.location.hostname === 'localhost') fileRoute = 'https://web.qa.twake.app' + fileRoute; // TODO: REMOVE
  return (
    <div className="result-item" onClick={onClick}>
      <img src={fileRoute} />
    </div>
  );
};
