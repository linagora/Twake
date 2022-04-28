import React, { useEffect, useRef } from 'react';
import ListBuilder from './list-builder';
import TimeSeparator from './message/time-separator';
import MessageWithReplies from './message/message-with-replies';
import FirstThreadMessage from './message/parts/FirstMessage/FirstThreadMessage';
import { MessagesListContext } from './messages-list';
import { useThreadMessages } from 'app/features/messages/hooks/use-thread-messages';
import { withNonMessagesComponents } from './with-non-messages-components';
import { useHighlightMessage } from 'app/features/messages/hooks/use-highlight-message';
import { VirtuosoHandle } from 'react-virtuoso';

type Props = {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
  threadId: string;
};

export default ({ companyId, threadId }: Props) => {
  const listBuilderRef = useRef<VirtuosoHandle>(null);
  const { highlight, cancelHighlight, reachedHighlight } = useHighlightMessage();
  let { messages, loadMore, window, jumpTo } = useThreadMessages({
    companyId,
    threadId: threadId || '',
  });
  messages = withNonMessagesComponents(messages, window.reachedStart);

  useEffect(() => {
    //Manage scroll to highlight
    if (
      listBuilderRef.current &&
      highlight &&
      !highlight.reached &&
      highlight.threadId === threadId
    ) {
      // Find the correct index of required message
      const index = messages.findIndex(m => m.id === highlight.id);
      if (index < 0) {
        // Load the right portion of messages
        jumpTo(highlight.id);
        return;
      }
      setTimeout(() => {
        if (listBuilderRef.current)
          listBuilderRef.current.scrollToIndex({
            align: 'start',
            index: index,
          });
        setTimeout(() => reachedHighlight(), 1000);
      }, 1000);
    }
  }, [highlight, messages.length]);

  return (
    <MessagesListContext.Provider value={{ hideReplies: true, withBlock: false }}>
      <ListBuilder
        key={threadId}
        refVirtuoso={listBuilderRef}
        onScroll={() => cancelHighlight()}
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
