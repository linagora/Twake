import { useMessage } from 'app/features/messages/hooks/use-message';
import { useThreadMessages } from 'app/features/messages/hooks/use-thread-messages';
import React, { useContext } from 'react';
import Languages from 'services/languages/languages';
import ThreadSection from '../../parts/thread-section';
import { MessageContext } from '../message-with-replies';

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
