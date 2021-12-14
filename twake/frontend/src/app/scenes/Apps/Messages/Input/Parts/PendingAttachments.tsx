import React, { useEffect } from 'react';
import { Col, Row } from 'antd';
import { useUpload } from 'app/state/recoil/hooks/useUpload';
import { useUploadZones } from 'app/state/recoil/hooks/useUploadZones';
import FileComponent from 'app/components/File/FileComponent';
import '../Input.scss';
import { DataFileType } from 'app/components/File/types';
import Globals from 'services/Globals';
import { PendingFileRecoilType } from 'app/models/File';
import { MessageFileType } from 'app/models/Message';
import _ from 'lodash';
import FileUploadAPIClient from 'app/components/FileUploads/FileUploadAPIClient';
import PossiblyPendingAttachment from '../../Message/Parts/PossiblyPendingAttachment';

type PropsType = {
  zoneId: string;
  initialValue?: MessageFileType[];
  onChange?: (list: MessageFileType[]) => void;
};

export default ({ zoneId, onChange, initialValue }: PropsType) => {
  const { getOnePendingFile } = useUpload();
  const { files, setFiles } = useUploadZones(zoneId);

  useEffect(() => {
    if (initialValue) setFiles(initialValue.filter(f => f?.metadata?.source !== 'pending'));
  }, []);

  useEffect(() => {
    if (onChange) onChange(files);
  }, [files]);

  return files.length > 0 ? (
    <Row className="attached-files-container" justify="start">
      {files.map((file, index) => {
        return (
          <Col key={index}>
            <PossiblyPendingAttachment
              file={file}
              type={'input'}
              onRemove={() => setFiles(files.filter(f => f.id !== file.id))}
            />
          </Col>
        );
      })}
    </Row>
  ) : (
    <></>
  );
};
