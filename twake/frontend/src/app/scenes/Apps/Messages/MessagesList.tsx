import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useChannelMessages, useThreadMessages } from 'app/state/recoil/hooks/useMessages';
import ListBuilder from './ListBuilder';
import TimeSeparator from './Message/TimeSeparator';
import MessageWithReplies from './Message/MessageWithReplies';

type Props = {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
  threadId?: string;
};

export const MessagesListContext = React.createContext({ hideReplies: false });

export default ({ channelId, companyId, workspaceId, threadId }: Props) => {
  const { messages, loadMore } = useChannelMessages({
    companyId,
    workspaceId: workspaceId || '',
    channelId: channelId || '',
  });
  //  const { messages } = useThreadMessages({ companyId, threadId });

  useEffect(() => {
    (async () => {
      loadMore('history');
    })();
  }, []);

  return (
    <MessagesListContext.Provider value={{ hideReplies: false }}>
      <ListBuilder
        items={messages}
        itemId={m => m.threadId}
        itemContent={(index, m) => {
          const previous = messages[messages.map(m => m.threadId).indexOf(m.threadId) - 1];

          console.log('rerender list item virtuoso');

          return (
            <Suspense fallback="" key={m.threadId}>
              <TimeSeparator messageId={m} previousMessageId={previous} unreadAfter={0} />
              <MessageWithReplies companyId={m.companyId} threadId={m.threadId} />
            </Suspense>
          );
        }}
        loadMore={loadMore}
      />
    </MessagesListContext.Provider>
  );
};
