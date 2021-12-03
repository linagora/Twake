import { useThreadMessages } from 'app/state/recoil/hooks/useMessages';
import React, { useContext } from 'react';
import Languages from 'services/languages/languages';
import ThreadSection from '../../Parts/ThreadSection';
import { MessageContext } from '../MessageWithReplies';

const MAX_RESPONSES = 3;

export default () => {
  const context = useContext(MessageContext);
  let { messages } = useThreadMessages(context);

  return (
    <>
      {messages.length > MAX_RESPONSES && (
        <ThreadSection gradient>
          <div className="message-content">
            <span onClick={() => {}} className="link">
              {Languages.t('scenes.apps.messages.message.show_responses_button')} ({messages.length}
              )
            </span>
          </div>
        </ThreadSection>
      )}
    </>
  );
};
