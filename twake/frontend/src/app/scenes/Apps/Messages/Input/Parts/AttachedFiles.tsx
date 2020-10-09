import React, { useState } from 'react';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditors';
import File from 'components/Drive/File.js';
import '../Input.scss';

export default (props: { channelId: string; threadId: string }) => {
  const editorManager = MessageEditorsManager.get(props.channelId);
  editorManager.useListener(useState);

  return (
    (editorManager.filesAttachements[props.threadId || 'main']?.length && (
      <div className="attached-files-container">
        {editorManager.filesAttachements[props.threadId || 'main'].map((id: string) => {
          return (
            <File
              mini
              key={id}
              data={{ id: id }}
              notInDrive={true}
              className="attached-file"
              removeIcon
              removeOnClick={() => editorManager.onRemoveAttachement(props.threadId, id)}
            />
          );
        })}
      </div>
    )) ||
    null
  );
};
