import React, { useState, useEffect } from 'react';
import InputOptions from './Parts/InputOptions';
import InputAutocomplete from './Parts/InputAutocomplete';
import EphemeralMessages from './Parts/EphemeralMessages';
import MessageEditorsManager, { MessageEditors } from 'app/services/Apps/Messages/MessageEditors';
import MessagesService from 'services/Apps/Messages/Messages.js';
import AttachedFiles from './Parts/AttachedFiles';
import './Input.scss';

type Props = {
  messageId?: string;
  channelId: string;
  threadId: string;
  collectionKey: string;
  onResize?: (evt: any) => void;
  onEscape?: (evt: any) => void;
  onFocus?: () => void;
  ref?: (node: any) => void;
  onSend?: (text: string) => void;
  triggerApp?: (app: any, from_icon: any, evt: any) => void;
  localStorageIdentifier?: string;
  disableApps?: boolean;
  context?: string; //Main input or response input (empty string)
};

export default (props: Props) => {
  const [hasEphemeralMessage, setHasEphemeralMessage] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const messageEditorService: MessageEditors = MessageEditorsManager.get(props.channelId);
  messageEditorService.useListener(useState);

  let autocomplete: any = null;
  let disable_app: any = {};
  let hasFilesAttached: boolean = messageEditorService.filesAttachements[props.threadId || 'main']
    ?.length
    ? true
    : false;
  const onChange = (text: string) => {
    setContent(text);
  };
  const onSend = () => {
    const content = messageEditorService.getContent(props.threadId, props.messageId || '');
    if (props.onSend) {
      props.onSend(content);
      return;
    }
    if (
      content.trim() ||
      messageEditorService.filesAttachements[props.threadId || 'main']?.length
    ) {
      sendMessage(content);
      autocomplete.setContent('');
      autocomplete.blur();
      return true;
    }
    return false;
  };

  const triggerApp = (app: any, from_icon: any, evt: any) => {
    if (disable_app[app.id] && new Date().getTime() - disable_app[app.id] < 1000) {
      return;
    }
    disable_app[app.id] = new Date().getTime();
    MessagesService.triggerApp(props.channelId, props.threadId, app, from_icon, evt);
  };

  const sendMessage = (val: string) => {
    setLoading(true);
    MessagesService.iamWriting(props.channelId, props.threadId, false);
    MessagesService.sendMessage(
      val,
      {
        channel_id: props.channelId,
        parent_message_id: props.threadId || '',
      },
      props.collectionKey,
    )
      .then(message => {
        setLoading(false);
        if (message) {
          if (
            messageEditorService.currentEditor ===
            messageEditorService.getEditorId(props.threadId, props.messageId || '', props.context)
          ) {
            autocomplete.focus();
          }
          if (!message.parent_message_id) {
            messageEditorService.openEditor(message.id, props.messageId || '');
          }
        }
      })
      .finally(() => {
        messageEditorService.clearAttachments(props.threadId);
      });
  };

  const focus = () => {
    messageEditorService.openEditor(props.threadId || '', props.messageId || '', props.context);
  };

  return (
    <div
      className={
        'message-input ' +
        (loading ? 'loading ' : '') +
        (messageEditorService.currentEditor !==
        messageEditorService.getEditorId(props.threadId, props.messageId || '', props.context)
          ? 'unfocused '
          : '')
      }
      ref={props.ref}
      onClick={() => focus()}
    >
      <EphemeralMessages
        channelId={props.channelId}
        threadId={props.threadId}
        collectionKey={props.collectionKey}
        onHasEphemeralMessage={() => {
          if (!hasEphemeralMessage) {
            setHasEphemeralMessage(true);
          }
        }}
        onNotEphemeralMessage={() => {
          if (hasEphemeralMessage) {
            setHasEphemeralMessage(false);
          }
        }}
      />
      <AttachedFiles channelId={props.channelId} threadId={props.threadId} />
      {!hasEphemeralMessage && (
        <InputAutocomplete
          messageId={props.messageId || ''}
          onPaste={(evt: any) => messageEditorService.getUploadZone(props.threadId).paste(evt)}
          channelId={props.channelId}
          threadId={props.threadId}
          onChange={(text: string) => {
            onChange(text);
          }}
          onSend={() => onSend()}
          onFocus={() => focus()}
          autocompleteRef={node => {
            autocomplete = node || autocomplete;
          }}
          onEditLastMessage={() => {
            MessagesService.startEditingLastMessage({
              channel_id: props.channelId,
              parent_message_id: props.threadId,
            });
          }}
        />
      )}

      {!hasEphemeralMessage && !props.messageId && (
        <InputOptions
          inputValue={content}
          isEmpty={!(content || hasFilesAttached)}
          channelId={props.channelId}
          threadId={props.threadId}
          onSend={() => onSend()}
          triggerApp={(app, fromIcon, evt) => triggerApp(app, fromIcon, evt)}
          onAddEmoji={emoji => {
            if (autocomplete) {
              autocomplete && autocomplete.putTextAtCursor(' ' + emoji.native + ' ');
              setTimeout(() => {
                autocomplete && autocomplete.focus();
              }, 200);
            }
          }}
        />
      )}
    </div>
  );
};
