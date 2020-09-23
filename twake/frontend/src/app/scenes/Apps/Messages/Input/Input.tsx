import React, { useState, useEffect } from 'react';
import InputOptions from './Parts/InputOptions';
import InputAutocomplete from './Parts/InputAutocomplete';
import EphemeralMessages from './Parts/EphemeralMessages';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditors';
import MessagesService from 'services/Apps/Messages/Messages.js';
import './Input.scss';

type Props = {
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
  const messageEditorService = MessageEditorsManager.get(props.channelId);
  messageEditorService.useListener(useState);
  let autocomplete: any = null;
  let disable_app: any = {};

  const onChange = (text: string) => {
    setContent(text);
    console.log(text);
  };
  const onSend = () => {
    const content = messageEditorService.getContent(props.threadId);
    if (content.trim()) {
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
    ).then(message => {
      setLoading(false);
      if (!message.parent_message_id) {
        messageEditorService.openEditor(message.id);
      }
    });
  };

  return (
    <div className={'message-input ' + (loading ? 'loading ' : '')} ref={props.ref}>
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

      {!hasEphemeralMessage && (
        <InputAutocomplete
          channelId={props.channelId}
          threadId={props.threadId}
          onChange={(text: string) => {
            onChange(text);
          }}
          onSend={(text: string) => onSend()}
          onFocus={() => messageEditorService.openEditor(props.threadId, props.context)}
          autocompleteRef={node => {
            autocomplete = node || autocomplete;
          }}
        />
      )}

      {!hasEphemeralMessage && (
        <InputOptions
          inputValue={content}
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
