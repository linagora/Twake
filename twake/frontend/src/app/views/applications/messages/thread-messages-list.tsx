import React from 'react';
import ListBuilder from './list-builder';
import TimeSeparator from './message/time-separator';
import MessageWithReplies from './message/message-with-replies';
import FirstThreadMessage from './message/parts/FirstMessage/FirstThreadMessage';
import { MessagesListContext } from './messages-list';
import { useThreadMessages } from 'app/features/messages/hooks/use-thread-messages';
import { withNonMessagesComponents } from './with-non-messages-components';

type Props = {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
  threadId: string;
};

export default ({ companyId, threadId }: Props) => {
  let { messages, loadMore, window } = useThreadMessages({
    companyId,
    threadId: threadId || '',
  });
  messages = withNonMessagesComponents(messages, window.reachedStart);

  return (
    <MessagesListContext.Provider value={{ hideReplies: true, withBlock: false }}>
      <ListBuilder
        key={threadId}
        items={messages}
        itemId={m => m.type + m.id}
        window={window}
        emptyListComponent={<FirstThreadMessage noReplies />}
        itemContent={(index, m) => {
          if (m.type === 'timeseparator') {
            return (
              <div key={m.type + m.id}>
                <TimeSeparator date={m.date || 0} />
              </div>
            );
          }

          if (m.type === 'header') {
            return (
              <div key={m.type + m.threadId}>
                <FirstThreadMessage />
              </div>
            );
          }

          return (
            <div key={m.type + m.id}>
              <MessageWithReplies companyId={m.companyId} threadId={m.threadId} id={m.id} />
            </div>
          );
        }}
        loadMore={loadMore}
      />
    </MessagesListContext.Provider>
  );
};
