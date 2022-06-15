import React, { useContext } from 'react';
import { CornerDownRight } from 'react-feather';
import ThreadSection from '../../parts/thread-section';
import Languages from 'app/features/global/services/languages-service';
import { useMessage } from 'app/features/messages/hooks/use-message';
import { MessageContext } from '../message-with-replies';
import { useVisibleMessagesEditorLocation } from 'app/features/messages/hooks/use-message-editor';
import { ViewContext } from 'app/views/client/main-view/MainContent';
import Input from '../../input/input';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';

type Props = {};

export default (props: Props) => {
  const context = useContext(MessageContext);
  const channelId = useRouterChannel();
  const { message } = useMessage(context);

  const location = `thread-${message.thread_id}`;
  const subLocation = useContext(ViewContext).type;
  const { active: editorIsActive, set: setVisibleEditor } = useVisibleMessagesEditorLocation(
    location,
    subLocation,
  );

  if (message.subtype === 'deleted' || message.thread_id != message.id) {
    return <></>;
  }

  if (editorIsActive) {
    return (
      <ThreadSection small alinea>
        <div className="message-content">
          <Input threadId={message?.id || ''} channelId={channelId} />
        </div>
      </ThreadSection>
    );
  }

  return (
    <ThreadSection compact>
      <div className="message-content">
        <span
          className="link"
          onClick={() =>
            setVisibleEditor({
              location,
              subLocation,
            })
          }
        >
          <CornerDownRight size={14} /> {Languages.t('scenes.apps.messages.message.reply_button')}
        </span>
      </div>
    </ThreadSection>
  );
};
