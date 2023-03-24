import { useMessage } from 'app/features/messages/hooks/use-message';
import { useThreadMessages } from 'app/features/messages/hooks/use-thread-messages';
import React, { useContext } from 'react';
import Languages from 'app/features/global/services/languages-service';
import ThreadSection from '../../parts/thread-section';
import { MessageContext } from '../message-with-replies';
import { NodeMessage } from 'app/features/messages/types/message';

export default (props: { firstMessageId: string; onFirstMessageChanged: (item: NodeMessage) => void }) => {
  const context = useContext(MessageContext);
  const { message } = useMessage(context);
  const { messages, window, loadMore } = useThreadMessages({
    companyId: context.companyId,
    threadId: message.thread_id,
  });

  const loadMoreMessages = async (direction: 'history' | 'future') => {
    const messages = await loadMore(direction, 10, props.firstMessageId);
    props.onFirstMessageChanged && props.onFirstMessageChanged(messages[0]);
  };

  return (
    <>
      {!(window.reachedStart && window.start === props.firstMessageId) &&
        window.end &&
        messages.length < message.stats.replies && (
          <ThreadSection gradient>
            <div className="message-content">
              <span onClick={() => loadMoreMessages('history')} className="link">
                {Languages.t('scenes.apps.messages.message.show_responses_button')} (
                {Math.max(message.stats.replies, messages.length)})
              </span>
            </div>
          </ThreadSection>
        )}
    </>
  );
};
