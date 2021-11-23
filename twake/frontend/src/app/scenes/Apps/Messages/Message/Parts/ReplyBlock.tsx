import React, { useContext } from 'react';
import { CornerDownRight } from 'react-feather';
import ThreadSection from '../../Parts/ThreadSection';
import Languages from 'services/languages/languages';
import { useMessage } from 'app/state/recoil/hooks/useMessage';
import { MessageContext } from '../MessageWithReplies';

type Props = {};

export default (props: Props) => {
  const context = useContext(MessageContext);
  let { message } = useMessage(context);

  if (message.subtype === 'deleted' || message.thread_id != message.id) {
    return <></>;
  }

  return (
    <ThreadSection compact>
      <div className="message-content">
        <span className="link" onClick={() => {}}>
          <CornerDownRight size={14} /> {Languages.t('scenes.apps.messages.message.reply_button')}
        </span>
      </div>
    </ThreadSection>
  );
};
