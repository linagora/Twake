import React, { ReactNode, useEffect } from 'react';
import { MessageFileType } from 'app/models/Message';
import { useUploadZones } from 'app/state/recoil/hooks/useUploadZones';
import { ChannelType } from 'app/features/channels/types/channel';
import { useMessageEditor } from 'app/state/recoil/hooks/messages/useMessageEditor';

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
