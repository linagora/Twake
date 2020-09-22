import React, { useState, useEffect } from 'react';
import InputOptions from './Parts/InputOptions';
import InputAutocomplete from './Parts/InputAutocomplete';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditors';
import './Input.scss';
import { threadId } from 'worker_threads';

type Props = {
  onResize?: (evt: any) => void;
  onEscape?: (evt: any) => void;
  onFocus?: () => void;
  ref?: (node: any) => void;
  onChange?: (text: string) => void;
  localStorageIdentifier?: string;
  disableApps?: boolean;
  channelId: string;
  threadId: string;
  context?: string; //Main input or response input (empty string)
};

export default (props: Props) => {
  const [content, setContent] = useState('');
  const messageEditorService = MessageEditorsManager.get(props.channelId);
  messageEditorService.useListener(useState);
  useEffect(() => {
    focus();
    setContent(messageEditorService.getContent(props.threadId));
  }, []);

  const onChange = (text: string) => {
    console.log(text);
  };

  return (
    <div className="message-input" ref={props.ref}>
      <InputAutocomplete
        channelId={props.channelId}
        threadId={props.threadId}
        onChange={(text: string) => {
          onChange(text);
        }}
        onFocus={() => messageEditorService.openEditor(props.threadId, props.context)}
      />

      <InputOptions />
    </div>
  );
};
