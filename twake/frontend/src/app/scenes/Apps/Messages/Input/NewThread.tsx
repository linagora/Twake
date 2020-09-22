import React, { useState, useEffect } from 'react';
import Thread from '../Parts/Thread';
import ThreadSection from '../Parts/ThreadSection';
import { PlusCircle } from 'react-feather';
import Input from './Input';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditors';
import './Input.scss';

type Props = {
  useButton?: boolean;
  collectionKey: string;
  channelId: string;
  threadId: string;
};

export default (props: Props) => {
  const messageEditorService = MessageEditorsManager.get(props.channelId);
  messageEditorService.useListener(useState);

  useEffect(() => {
    if (!props.useButton && messageEditorService.currentEditor === false) {
      messageEditorService.openEditor(props.threadId, 'main');
    }
  }, []);

  if (messageEditorService.currentEditor !== props.threadId + '_main' && props.useButton) {
    return (
      <Thread
        withBlock
        className="new-thread-button"
        onClick={() => {
          messageEditorService.openEditor(props.threadId, 'main');
        }}
      >
        <ThreadSection noSenderSpace>
          <PlusCircle size={16} className="plus-icon" /> Start a new discussion
        </ThreadSection>
      </Thread>
    );
  } else {
    return (
      <Thread withBlock className="new-thread">
        <ThreadSection noSenderSpace>
          <Input
            ref={node => messageEditorService.setInputNode(props.threadId + '_main', node)}
            channelId={props.channelId}
            threadId={props.threadId}
            collectionKey={props.collectionKey}
            context={'main'}
          />
        </ThreadSection>
      </Thread>
    );
  }
};
