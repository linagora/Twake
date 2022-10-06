import React, { useContext } from 'react';
import { PlusCircle } from 'react-feather';

import Thread from '../parts/thread';
import ThreadSection from '../parts/thread-section';
import Input from './input';
import Languages from 'app/features/global/services/languages-service';
import { ViewContext } from 'app/views/client/main-view/MainContent';
import { useVisibleMessagesEditorLocation } from 'app/features/messages/hooks/use-message-editor';

import './input.scss';
import { Button } from 'app/atoms/button/button';
import { ThreadNewIcon } from 'app/atoms/icons-agnostic';

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
        <div className="p-2">
          <Button
            theme="default"
            className="w-full justify-center"
            onClick={() => {
              setVisibleEditor({ location, subLocation });
            }}
          >
            <ThreadNewIcon className="mr-2" />
            {Languages.t('scenes.apps.messages.new_thread', [], 'Start a new discussion')}
          </Button>
        </div>
      </Thread>
    );
  } else {
    return (
      <Thread withBlock className="new-thread">
        <div className="py-1 px-2">
          <Input channelId={props.channelId} threadId={props.threadId} />
        </div>
      </Thread>
    );
  }
};
