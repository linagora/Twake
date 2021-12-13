import { useMessage } from 'app/state/recoil/hooks/messages/useMessage';
import { useThreadMessages } from 'app/state/recoil/hooks/messages/useThreadMessages';
import React, { useContext } from 'react';
import Languages from 'services/languages/languages';
import ThreadSection from '../../Parts/ThreadSection';
import { MessageContext } from '../MessageWithReplies';

export default () => {
  const context = useContext(MessageContext);
  let { message } = useMessage(context);
  let { messages, window, loadMore } = useThreadMessages({
    companyId: context.companyId,
    threadId: message.thread_id,
  });

  return (
    <>
      {!window.reachedStart && window.end && (
        <ThreadSection gradient>
          <div className="message-content">
            <span onClick={() => loadMore('history')} className="link">
              {Languages.t('scenes.apps.messages.message.show_responses_button')} (
              {Math.max(message.stats.replies, messages.length)})
            </span>
          </div>
        </ThreadSection>
      )}
    </>
  );
};
