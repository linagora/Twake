import React from 'react';
import { Col, Row } from 'antd';
import { useUpload } from 'app/state/recoil/hooks/useUpload';
import { useUploadZones } from 'app/state/recoil/hooks/useUploadZones';
import FileComponent from 'app/components/File/FileComponent';
import '../Input.scss';
import { DataFileType } from 'app/components/File/types';
import Globals from 'services/Globals';
import { PendingFileRecoilType } from 'app/models/File';

type PropsType = {
  zoneId: string;
};

export default ({ zoneId }: PropsType) => {
  const { getOnePendingFile, pendingFilesListState } = useUpload();
  const { currentUploadZoneFilesList } = useUploadZones(zoneId);

  return currentUploadZoneFilesList.length > 0 ? (
    <Row className="attached-files-container small-y-margin" justify="start">
      {currentUploadZoneFilesList.map((file, index) => {
        const id = file.metadata?.external_id || '';

        let status: PendingFileRecoilType['status'] | undefined;
        let progress = 1;

        let formatedFile: DataFileType = {
          id: id,
          name: file.metadata?.name || '',
          size: file.metadata?.size || 0,
          thumbnail: file.metadata?.thumbnails?.[0]?.url
            ? `${Globals.api_root_url}/internal/services/files/v1${file.metadata.thumbnails[0].url}`
            : undefined,
          type: file.metadata?.type as DataFileType['type'],
        };

        if (file?.metadata?.source === 'pending') {
          const pendingFile = getOnePendingFile(id);
          const pendingFileState = pendingFilesListState?.filter(o => o.id === id)[0] || undefined;
          if (pendingFileState) {
            formatedFile = {
              id: pendingFile?.backendFile?.id || '',
              name: pendingFile.originalFile.name,
              size: pendingFile.originalFile.size,
              thumbnail: URL.createObjectURL(pendingFile.originalFile),
              type: pendingFile.originalFile.type as DataFileType['type'],
            };
            status = pendingFileState.status || undefined;
            progress = pendingFile.progress;
          }
        }

        return formatedFile ? (
          <Col key={index}>
            <FileComponent
              className="small-right-margin small-bottom-margin"
              type="input"
              file={formatedFile}
              status={status}
              progress={progress}
            />
          </Col>
        ) : (
          <></>
        );
      })}
    </Row>
  ) : (
    <></>
  );
};
