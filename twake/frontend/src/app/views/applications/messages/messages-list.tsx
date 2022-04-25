import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useChannelMessages } from 'app/features/messages/hooks/use-channel-messages';
import ListBuilder from './list-builder';
import TimeSeparator from './message/time-separator';
import MessageWithReplies from './message/message-with-replies';
import FirstMessage from './message/parts/FirstMessage/FirstMessage';
import LockedHistoryBanner from 'app/components/locked-features-components/locked-history-banner/locked-history-banner';
import MessageHistoryService from 'app/features/messages/services/message-history-service';
import { useCompany, useCurrentCompany } from 'app/features/companies/hooks/use-companies';
import ChannelAPIClient from 'app/features/channels/api/channel-api-client';
import { delayRequest } from 'app/features/global/utils/managedSearchRequest';
import {
  MessagesAndComponentsType,
  withNonMessagesComponents,
} from './with-non-messages-components';

type Props = {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
  threadId?: string;
};

export const MessagesListContext = React.createContext({ hideReplies: false, withBlock: false });

export default ({ channelId, companyId, workspaceId, threadId }: Props) => {
  let { messages, loadMore, window } = useChannelMessages({
    companyId,
    workspaceId: workspaceId || '',
    channelId: channelId || '',
  });
  const { company } = useCurrentCompany();
  const shouldLimit = MessageHistoryService.shouldLimitMessages(
    company,
    messages[0]?.id || '',
    messages.length,
  );
  messages = withNonMessagesComponents(messages, window.reachedStart, shouldLimit);

  useEffect(() => {
    if (messages.length)
      ChannelAPIClient.read(companyId, workspaceId || '', channelId || '', { status: true });
  }, [messages.length > 0]);

  return (
    <MessagesListContext.Provider value={{ hideReplies: false, withBlock: true }}>
      <ListBuilder
        items={messages}
        itemId={m => m.type + m.threadId}
        emptyListComponent={<FirstMessage />}
        window={window}
        itemContent={(index, m: MessagesAndComponentsType) => {
          if (m.type === 'timeseparator') {
            return (
              <div key={m.type + m.threadId}>
                <TimeSeparator date={m.date || 0} />
              </div>
            );
          }

          if (m.type === 'header') {
            return (
              <div key={m.type + m.threadId}>
                <FirstMessage />
              </div>
            );
          }

          if (m.type === 'locked') {
            return (
              <div key={m.type + m.threadId}>
                <LockedHistoryBanner />
              </div>
            );
          }

          return (
            <div key={m.type + m.threadId}>
              <MessageWithReplies companyId={m.companyId} threadId={m.threadId} />
            </div>
          );
        }}
        loadMore={loadMore}
        atBottomStateChange={(atBottom: boolean) => {
          if (atBottom && window.reachedEnd)
            ChannelAPIClient.read(companyId, workspaceId || '', channelId || '', {
              status: true,
            });
        }}
      />
    </MessagesListContext.Provider>
  );
};
