import React, { ReactNode, useEffect } from 'react';
import { MessageFileType } from 'app/features/messages/types/message';
import { useUploadZones } from 'app/features/files/hooks/use-upload-zones';
import { ChannelType } from 'app/features/channels/types/channel';
import { useMessageEditor } from 'app/features/messages/hooks/use-message-editor';

export default (props: {
  children: ReactNode;
  setHandler: (handler: (file: MessageFileType) => void) => void;
  channel: ChannelType;
  threadId?: string;
}) => {
  const { key: editorId } = useMessageEditor({
    companyId: props.channel.company_id || '',
    workspaceId: props.channel.workspace_id || '',
    channelId: props.channel.id,
    threadId: props.threadId,
  });
  const { files, setFiles } = useUploadZones(editorId);

  useEffect(() => {
    props.setHandler((file: MessageFileType) => {
      setFiles([...files, file]);
    });
  }, [props.setHandler]);

  return <>{props.children}</>;
};
