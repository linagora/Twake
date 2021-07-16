import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'react-feather';
import Thread from '../Parts/Thread';
import ThreadSection from '../Parts/ThreadSection';
import Input from './Input';
import Languages from 'services/languages/languages';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditorServiceFactory';
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
      messageEditorService.openEditor(props.threadId, '', 'main');
    }
  }, []);

  if (messageEditorService.currentEditor !== props.threadId + '_main' && props.useButton) {
    return (
      <Thread
        withBlock
        className="new-thread-button"
        threadMain
        allowUpload
        channelId={props.channelId}
      >
        <ThreadSection
          noSenderSpace
          onClick={() => messageEditorService.openEditor(props.threadId, '', 'main')}
        >
          <PlusCircle size={16} className="plus-icon" />{' '}
          {Languages.t('scenes.apps.messages.new_thread', [], 'Start a new discussion')}
        </ThreadSection>
      </Thread>
    );
  } else {
    return (
      <Thread
        channelId={props.channelId}
        collectionKey={props.collectionKey}
        withBlock
        className="new-thread"
        allowUpload
        threadMain
      >
        <ThreadSection noSenderSpace>
          <Input
            ref={node => messageEditorService.setInputNode(props.threadId, '', 'main', node)}
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
