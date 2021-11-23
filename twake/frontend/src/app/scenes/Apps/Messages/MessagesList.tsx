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
        itemContent={index => {
          return (
            <Suspense fallback="">
              <TimeSeparator
                messageId={messages[index]}
                previousMessageId={messages[index - 1]}
                unreadAfter={0}
              />
              <MessageWithReplies
                companyId={messages[index].companyId}
                threadId={messages[index].threadId}
              />
            </Suspense>
          );
        }}
        loadMore={loadMore}
      />
    </MessagesListContext.Provider>
  );
};
