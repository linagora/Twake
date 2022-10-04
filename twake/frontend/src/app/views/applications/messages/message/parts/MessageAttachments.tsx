import React, { useContext, useEffect } from 'react';
import 'moment-timezone';
import { Row } from 'antd';
import { MessageContext } from '../message-with-replies';
import { useMessage } from 'app/features/messages/hooks/use-message';
import PossiblyPendingAttachment from './PossiblyPendingAttachment';
import { useUploadZones } from 'app/features/files/hooks/use-upload-zones';

export default () => {
  const context = useContext(MessageContext);
  const { message, save } = useMessage(context);

  const { files, setFiles } = useUploadZones(`message-${message.id}`);

  useEffect(() => {
    setFiles(message.files || []);
  }, [message.files]);

  useEffect(() => {
    const uploaded = files.filter(f => f.metadata?.source !== 'pending');
    const inMessage = (message.files || []).filter(f => f.metadata?.source !== 'pending');
    if (uploaded.length > inMessage.length) {
      save({ ...message, files: uploaded });
    }
  }, [files]);

  if (files.length === 0) {
    return <></>;
  }

  return (
    <Row justify="start" align="middle" className="small-top-margin" wrap>
      {files
        .filter(f => f.metadata)
        .map(file => (
          <PossiblyPendingAttachment
            key={file.metadata?.external_id || file.id}
            type={'message'}
            file={file}
            xlarge={files.length === 1 && (files[0].metadata?.thumbnails?.length || 0) > 0}
            large={
              //If all the documents are images
              files.length <= 6 &&
              files.filter(
                file =>
                  file.metadata?.source === 'internal' &&
                  (file.metadata?.thumbnails?.length || 0) > 0,
              ).length === files.length
            }
            onRemove={() => setFiles(files.filter(f => f.id !== file.id))}
          />
        ))}
    </Row>
  );
};
