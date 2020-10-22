import React, { useState } from 'react';
import Twacode from 'components/Twacode/Twacode';
import MessagesService from 'services/Apps/Messages/Messages.js';
import 'moment-timezone';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import Reactions from './Reactions';
import Options from './Options';
import MessageHeader from './MessageHeader';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import MessageEditorsManager, { MessageEditors } from 'app/services/Apps/Messages/MessageEditors';
import Input from '../../Input/Input';
import Button from 'components/Buttons/Button.js';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';

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
    PseudoMarkdownCompiler.transformBackChannelsUsers(
      typeof props.message?.content === 'string'
        ? props.message?.content
        : props.message?.content?.original_str,
    ),
  );

  const save = () => {
    const content = messageEditorService.getContent(
      props.message?.parent_message_id || '',
      props.message?.id || '',
    );

    if (!content) {
      MessagesService.deleteMessage(props.message, props.collectionKey);
    } else {
      MessagesService.editMessage(props.message.id, content, props.collectionKey);
    }
    messageEditorService.closeEditor();
  };

  return (
    <div style={{ paddingTop: '4px', paddingBottom: '12px' }}>
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
        onSend={() => {
          save();
        }}
      />

      <Button
        className="primary small-right-margin"
        small
        onClick={() => {
          save();
        }}
      >
        Save
      </Button>

      <Button className="secondary-light" small onClick={() => messageEditorService.closeEditor()}>
        Cancel
      </Button>
    </div>
  );
};
