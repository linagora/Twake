import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useChannelMessages } from 'app/features/messages/hooks/use-channel-messages';
import ListBuilder from './list-builder';
import TimeSeparator from './message/time-separator';
import MessageWithReplies from './message/message-with-replies';
import FirstMessage from './message/parts/FirstMessage/FirstMessage';
import LockedHistoryBanner from 'app/components/locked-features-components/locked-history-banner/locked-history-banner';
import MessageHistoryService from 'app/features/messages/services/message-history-service';
import { useCurrentCompany } from 'app/features/companies/hooks/use-companies';
import ChannelAPIClient from 'app/features/channels/api/channel-api-client';

type Props = {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
  threadId?: string;
};

export const MessagesListContext = React.createContext({ hideReplies: false, withBlock: false });

export default ({ channelId, companyId, workspaceId, threadId }: Props) => {
  const { messages, loadMore, window } = useChannelMessages({
    companyId,
    workspaceId: workspaceId || '',
    channelId: channelId || '',
  });

  const { company } = useCurrentCompany();

  useEffect(() => {
    if (messages.length)
      ChannelAPIClient.read(companyId, workspaceId || '', channelId || '', { status: true });
  }, [messages.length > 0]);

  return (
    <MessagesListContext.Provider value={{ hideReplies: false, withBlock: true }}>
      <ListBuilder
        items={messages}
        itemId={m => m.threadId}
        emptyListComponent={<FirstMessage />}
        window={window}
        itemContent={(index, m) => {
          const currentIndex = messages.map(m => m.threadId).indexOf(m.threadId);
          const previous = messages[currentIndex - 1];

          let head = <></>;
          if (window.reachedStart && currentIndex === 0) {
            head = <FirstMessage />;
          }

          if (
            company &&
            MessageHistoryService.shouldLimitMessages(company, window.start, messages.length)
          ) {
            head = <LockedHistoryBanner />;
          }

          return (
            <div key={m.threadId}>
              {head}
              <TimeSeparator
                key={previous?.threadId || m?.threadId}
                messageId={m}
                previousMessageId={previous}
                unreadAfter={0}
              />
              <MessageWithReplies companyId={m.companyId} threadId={m.threadId} />
            </div>
          );
        }}
        loadMore={loadMore}
        atBottomStateChange={(atBottom: boolean) => {
          if (atBottom && window.reachedEnd)
            ChannelAPIClient.read(companyId, workspaceId || '', channelId || '', { status: true });
        }}
      />
    </MessagesListContext.Provider>
  );
};
