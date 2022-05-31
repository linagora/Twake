import React from 'react';
import { FileType } from 'features/files/types/file';
import FileUploadService from 'features/files/services/file-upload-service';
import assert from 'assert';

type PropsType = {
  file: FileType;
  onDownloadClick: any;
  onPreviewClick: any;
};

export default ({ file, onDownloadClick, onPreviewClick }: PropsType): JSX.Element => {
  assert(
    file.metadata.external_id,
    'external_id is missing for file ' + JSON.stringify(file, null, 2),
  );

  const fileRoute = FileUploadService.getDownloadRoute({
    companyId: file.metadata.external_id.company_id,
    fileId: file.metadata.external_id.id,
  });

  return (
    <div className="result-item">
      <img src={fileRoute} />
    </div>
  );
};
