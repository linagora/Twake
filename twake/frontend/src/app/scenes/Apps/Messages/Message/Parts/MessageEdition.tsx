import React, { useState } from 'react';
import 'moment-timezone';
import MessagesService from 'services/Apps/Messages/Messages.js';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditorServiceFactory';
import Input from '../../Input/Input';
import Button from 'components/Buttons/Button.js';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import AlertManager from 'app/services/AlertManager/AlertManager';
import Languages from 'services/languages/languages.js';
import { Message } from 'app/services/Apps/Messages/Message';

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

  const save = async (content: string) => {
    if (!content) {
      AlertManager.confirm(
        () => {
          MessagesService.deleteMessage(props.message, props.collectionKey);
        },
        () => {},
        {
          title: Languages.t('scenes.apps.messages.chatbox.chat.delete_message_btn'),
        },
      );
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
        onSend={content => {
          save(content);
        }}
      />

      <Button
        className="primary small-right-margin"
        small
        onClick={async () => {
          save(
            await messageEditorService.getContent(
              props.message?.parent_message_id || '',
              props.message?.id || '',
            ),
          );
        }}
        value={Languages.t("scenes.apps.messages.message.save_button", [], "Save")}
      ></Button>

      <Button
        className="secondary-light"
        small
        onClick={() => messageEditorService.closeEditor()}
        value={Languages.t("scenes.apps.messages.message.cancel_button", [], "Cancel")}
      ></Button>
    </div>
  );
};
