import React from 'react';
import { Col, Row } from 'antd';
import { useUpload } from 'app/state/recoil/hooks/useUpload';
import { useUploadZones } from 'app/state/recoil/hooks/useUploadZones';
import FileComponent from 'app/components/File/FileComponent';
import '../Input.scss';

type PropsType = {
  zoneId: string;
};

export default ({ zoneId }: PropsType) => {
  const { getOnePendingFile, pendingFilesListState } = useUpload();
  const { currentUploadZoneFilesList } = useUploadZones(zoneId);

  return currentUploadZoneFilesList.length > 0 ? (
    <Row className="attached-files-container small-y-margin" justify="start">
      {currentUploadZoneFilesList.map((id, index) => {
        const pendingFile = getOnePendingFile(id);
        const pendingFileState = pendingFilesListState?.filter(o => o.id === id)[0] || undefined;

        console.log(pendingFile);
        return pendingFile && pendingFileState ? (
          <Col key={`${pendingFile.id}_${index}`}>
            <FileComponent
              key={`${pendingFile.id}_${index}`}
              className="small-right-margin small-bottom-margin"
              data={{
                type: 'input',
                file: {
                  id: pendingFileState.id,
                  name: pendingFile.originalFile.name,
                  size: pendingFile.originalFile.size,
                  thumbnail: { url: URL.createObjectURL(pendingFile.originalFile) },
                  type: pendingFile.originalFile.type,
                  status: pendingFileState.status || undefined,
                  progress: pendingFile.progress,
                  backendFileId: pendingFile?.backendFile?.id,
                },
              }}
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
