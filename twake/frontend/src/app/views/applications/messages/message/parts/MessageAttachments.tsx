import React, { useContext, useEffect } from 'react';
import 'moment-timezone';
import { Row } from 'antd';
import { MessageContext } from '../message-with-replies';
import { useMessage } from 'app/features/messages/hooks/use-message';
import PossiblyPendingAttachment from './PossiblyPendingAttachment';
import { useUploadZones } from 'app/state/recoil/hooks/useUploadZones';

export default () => {
  const context = useContext(MessageContext);
  let { message, save } = useMessage(context);

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
      {files.map((file, i) =>
        file.metadata ? (
          <PossiblyPendingAttachment
            key={i}
            type={'message'}
            file={file}
            onRemove={() => setFiles(files.filter(f => f.id !== file.id))}
          />
        ) : (
          <></>
        ),
      )}
    </Row>
  );
};
