import React, { useState, useEffect, useContext } from 'react';
import { PlusCircle } from 'react-feather';
import Thread from '../Parts/Thread';
import ThreadSection from '../Parts/ThreadSection';
import Input from './Input';
import Languages from 'services/languages/languages';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditorServiceFactory';
import './Input.scss';
import { ViewContext } from 'app/scenes/Client/MainView/MainContent';
import { useVisibleMessagesEditorLocation } from 'app/state/recoil/hooks/useMessageEditor';

type Props = {
  useButton?: boolean;
  collectionKey: string;
  channelId: string;
  threadId: string;
};

export default (props: Props) => {
  const location = `new-thread-${props.threadId || props.channelId}`;
  const subLocation = useContext(ViewContext).type;
  const { active: editorIsActive, set: setVisibleEditor } = useVisibleMessagesEditorLocation(
    location,
    subLocation,
  );

  if (!editorIsActive && props.useButton) {
    return (
      <Thread withBlock className="new-thread-button">
        <ThreadSection
          noSenderSpace
          onClick={() => {
            setVisibleEditor({ location, subLocation });
          }}
        >
          <PlusCircle size={16} className="plus-icon" />{' '}
          {Languages.t('scenes.apps.messages.new_thread', [], 'Start a new discussion')}
        </ThreadSection>
      </Thread>
    );
  } else {
    return (
      <Thread withBlock className="new-thread">
        <ThreadSection noSenderSpace>
          <Input channelId={props.channelId} threadId={props.threadId} />
        </ThreadSection>
      </Thread>
    );
  }
};
