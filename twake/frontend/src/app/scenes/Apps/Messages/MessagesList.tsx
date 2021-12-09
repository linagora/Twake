import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useChannelMessages, useThreadMessages } from 'app/state/recoil/hooks/useMessages';
import ListBuilder from './ListBuilder';
import TimeSeparator from './Message/TimeSeparator';
import MessageWithReplies from './Message/MessageWithReplies';
import FirstMessage from './Message/Parts/FirstMessage/FirstMessage';
import LockedHistoryBanner from 'app/components/LockedFeaturesComponents/LockedHistoryBanner/LockedHistoryBanner';
import MessageHistoryService from 'app/services/Apps/Messages/MessageHistoryService';
import { useCurrentCompany } from 'app/state/recoil/hooks/useCompanies';

type Props = {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
  threadId?: string;
};

export const MessagesListContext = React.createContext({ hideReplies: false });

export default ({ channelId, companyId, workspaceId, threadId }: Props) => {
  const { messages, loadMore, window } = useChannelMessages({
    companyId,
    workspaceId: workspaceId || '',
    channelId: channelId || '',
  });

  const { company } = useCurrentCompany();

  useEffect(() => {
    (async () => {
      if (window.reachedEnd) {
        loadMore('future');
      } else {
        loadMore('history');
      }
    })();
  }, [channelId]);

  if (messages.length === 0) {
    return (
      <div style={{ flex: 1 }}>
        <FirstMessage />
      </div>
    );
  }

  return (
    <MessagesListContext.Provider value={{ hideReplies: false }}>
      <ListBuilder
        items={messages}
        itemId={m => m.threadId}
        itemContent={(index, m) => {
          const currentIndex = messages.map(m => m.threadId).indexOf(m.threadId);
          const previous = messages[currentIndex - 1];

          let head = <></>;
          if (window.reachedStart && currentIndex === 0) {
            head = <FirstMessage />;
          }

          if (MessageHistoryService.shouldLimitMessages(company, window.start, messages.length)) {
            head = <LockedHistoryBanner />;
          }

          return (
            <Suspense fallback="" key={m.threadId}>
              {head}
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
