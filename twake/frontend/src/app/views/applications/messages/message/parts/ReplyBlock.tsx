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
import { getChannel, useIsChannelMember } from 'app/features/channels/hooks/use-channel';


export default () => {
  const context = useContext(MessageContext);
  const channelId = useRouterChannel();
  const { message } = useMessage(context);
  const channel = getChannel(channelId);

  const location = `thread-${message.thread_id}`;
  const subLocation = useContext(ViewContext).type;
  const { active: editorIsActive, set: setVisibleEditor } = useVisibleMessagesEditorLocation(
    location,
    subLocation,
  );

  const isChannelMember = useIsChannelMember(channelId);

  if (!isChannelMember) {
    return <></>;
  }

  if (message.subtype === 'deleted' || message.thread_id != message.id) {
    return <></>;
  }

  if (channel?.visibility === 'direct') {
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
          <CornerDownRight size={14} className="inline" />{' '}
          {Languages.t('scenes.apps.messages.message.reply_button')}
        </span>
      </div>
    </ThreadSection>
  );
};
