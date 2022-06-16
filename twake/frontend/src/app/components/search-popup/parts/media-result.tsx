import React from 'react';
import { FileSearchResult } from 'features/messages/types/message';
import Logger from 'features/global/framework/logger-service';
import FileUploadAPIClient from 'features/files/api/file-upload-api-client';

type PropsType = {
  fileSearchResult: FileSearchResult;
  onClick: any;
};

export default ({ fileSearchResult, onClick }: PropsType): JSX.Element => {
  let fileRoute = FileUploadAPIClient.getFileThumbnailUrlFromMessageFile(fileSearchResult);
  if (!fileRoute) {
    try {
      fileRoute = FileUploadAPIClient.getFileThumbnailUrl(fileSearchResult.metadata?.external_id);
    } catch (e) {
      console.log(e);
      console.error(fileSearchResult);
    }
  }

  if (!fileRoute) {
    Logger.getLogger('SearchPopup:MediaResult').error('No thumbnail for object', fileSearchResult);
    return <div />;
  }

  return (
    <div className="p-1" onClick={onClick}>
      <img
        className="object-cover cursor-pointer w-24 h-24 rounded-lg shadow-md transition-transform hover:scale-105"
        alt={fileSearchResult.metadata?.name}
        src={fileRoute}
      />
    </div>
  );
};
