import React from 'react';
import ListBuilder from './list-builder';
import TimeSeparator from './message/time-separator';
import MessageWithReplies from './message/message-with-replies';
import FirstThreadMessage from './message/parts/FirstMessage/FirstThreadMessage';
import { MessagesListContext } from './messages-list';
import { useThreadMessages } from 'app/features/messages/hooks/use-thread-messages';

type Props = {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
  threadId: string;
};

export default ({ companyId, threadId }: Props) => {
  const { messages, loadMore, window } = useThreadMessages({
    companyId,
    threadId: threadId || '',
  });

  return (
    <MessagesListContext.Provider value={{ hideReplies: true, withBlock: false }}>
      <ListBuilder
        key={threadId}
        items={messages}
        itemId={m => m.id}
        window={window}
        emptyListComponent={<FirstThreadMessage noReplies />}
        itemContent={(index, m) => {
          const currentIndex = messages.map(m => m.id).indexOf(m.id);
          const previous = messages[currentIndex - 1];

          let head = <></>;
          if (window.reachedStart && currentIndex === 0) {
            head = <FirstThreadMessage />;
          }

          return (
            <div key={m.id}>
              {head}
              <TimeSeparator
                key={previous?.id || m?.id}
                messageId={m}
                previousMessageId={previous}
                unreadAfter={0}
              />
              <MessageWithReplies companyId={m.companyId} threadId={m.threadId} id={m.id} />
            </div>
          );
        }}
        loadMore={loadMore}
      />
    </MessagesListContext.Provider>
  );
};
