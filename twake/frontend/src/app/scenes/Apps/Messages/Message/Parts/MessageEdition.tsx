import React, { useState } from 'react';
import Twacode from 'components/Twacode/Twacode.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import 'moment-timezone';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import Reactions from './Reactions';
import Options from './Options';
import MessageHeader from './MessageHeader';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import MessageEditorsManager, { MessageEditors } from 'app/services/Apps/Messages/MessageEditors';
import Input from '../../Input/Input';

type Props = {
  message: Message;
  collectionKey: string;
};

export default (props: Props) => {
  const messageEditorService = MessageEditorsManager.get(props.message?.channel_id || '');
  messageEditorService.useListener(useState);
  messageEditorService.setContent(
    props.message?.parent_message_id || '',
    props.message?.id || '',
    props.message?.content?.original_str,
  );

  return (
    <div>
      <Input
        ref={node =>
          messageEditorService.setInputNode(
            props.message?.parent_message_id || '',
            props.message?.id || '',
            'edition',
            node,
          )
        }
        channelId={props.message?.channel_id || ''}
        threadId={props.message?.parent_message_id || ''}
        messageId={props.message?.id || ''}
        collectionKey={props.collectionKey}
        context={'edition'}
      />
    </div>
  );
};
