import React, { useContext } from 'react';
import { CornerDownRight } from 'react-feather';
import ThreadSection from '../../Parts/ThreadSection';
import Languages from 'services/languages/languages';
import { useMessage } from 'app/state/recoil/hooks/messages/useMessage';
import { MessageContext } from '../MessageWithReplies';
import { useVisibleMessagesEditorLocation } from 'app/state/recoil/hooks/messages/useMessageEditor';
import { ViewContext } from 'app/scenes/Client/MainView/MainContent';
import Input from '../../Input/Input';

type Props = {};

export default (props: Props) => {
  const context = useContext(MessageContext);
  let { message } = useMessage(context);

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
          <Input threadId={message?.id || ''} />
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
