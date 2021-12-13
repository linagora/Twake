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
        const id = file.metadata?.external_id || '';

        let status: PendingFileRecoilType['status'] | undefined = 'success';
        let progress = 1;

        let formatedFile: DataFileType = {
          id: id,
          name: file.metadata?.name || '',
          size: file.metadata?.size || 0,
          thumbnail: FileUploadAPIClient.getFileThumbnailUrlFromMessageFile(file) || '',
          type: FileUploadAPIClient.mimeToType(file.metadata?.mime || ''),
        };

        if (file?.metadata?.source === 'pending') {
          const pendingFile = getOnePendingFile(id);
          if (!pendingFile) {
            return <></>;
          }
          formatedFile = {
            id: pendingFile?.backendFile?.id || '',
            name: pendingFile.originalFile.name,
            size: pendingFile.originalFile.size,
            thumbnail: URL.createObjectURL(pendingFile.originalFile),
            type: FileUploadAPIClient.mimeToType(pendingFile.originalFile.type || ''),
          };
          status = pendingFile.status || undefined;
          progress = pendingFile.progress;
        }

        return formatedFile ? (
          <Col key={index}>
            <FileComponent
              className="small-right-margin small-bottom-margin"
              type="input"
              file={formatedFile}
              status={status}
              progress={progress}
              onRemove={() => setFiles(files.filter(f => f.id !== file.id))}
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
