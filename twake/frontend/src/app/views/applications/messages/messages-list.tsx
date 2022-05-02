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
import { useHighlightMessage } from 'app/features/messages/hooks/use-highlight-message';
import { VirtuosoHandle } from 'react-virtuoso';
import SideViewService from 'app/features/router/services/side-view-service';
import { Application } from 'app/features/applications/types/application';
import RouterServices from 'app/features/router/services/router-service';
import GoToBottom from './parts/go-to-bottom';

type Props = {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
  threadId?: string;
};

export const MessagesListContext = React.createContext({ hideReplies: false, withBlock: false });

export default ({ channelId, companyId, workspaceId, threadId }: Props) => {
  const listBuilderRef = useRef<VirtuosoHandle>(null);

  let { messages, loadMore, window, jumpTo, convertToKeys } = useChannelMessages(
    {
      companyId,
      workspaceId: workspaceId || '',
      channelId: channelId || '',
    },
    {
      onMessages: messages => {
        console.log('vir new messages: ', messages);
      },
    },
  );
  const { company } = useCurrentCompany();
  const shouldLimit = MessageHistoryService.shouldLimitMessages(
    company,
    messages[0]?.id || '',
    messages.length,
  );
  messages = withNonMessagesComponents(messages, window.reachedStart, shouldLimit);

  console.log('vir messages: ', messages);

  const loadMoreMessages = async (
    direction: 'history' | 'future',
    limit?: number,
    offsetItem?: MessagesAndComponentsType,
  ) => {
    console.log('vir loadMoreMessages', direction, limit, offsetItem);
    let messages = await loadMore(direction, limit, offsetItem?.threadId);
    return withNonMessagesComponents(
      convertToKeys(company.id, messages),
      window.reachedStart,
      shouldLimit,
    );
  };

  useEffect(() => {
    if (messages.length === 0) {
      console.log('vir loadMoreMessages from useEffect', 'history');
      loadMore('history');
    }
  }, []);

  const { highlight, cancelHighlight, reachedHighlight, updateHighlight } = useHighlightMessage();

  useEffect(() => {
    const { threadId, messageId } = RouterServices.getStateFromRoute();
    console.log('vir', { id: '', threadId });
    if (threadId) {
      updateHighlight({ id: messageId || threadId, threadId });
    }
  }, []);

  useEffect(() => {
    //Manage scroll to highlight
    if (listBuilderRef.current && highlight && !highlight.reached) {
      if (highlight.id !== highlight.threadId) {
        SideViewService.select(channelId || '', {
          app: { identity: { code: 'messages' } } as Application,
          context: {
            viewType: 'channel_thread',
            threadId: highlight.threadId,
          },
        });
      }

      // Find the correct index of required message
      const index = messages.findIndex(m => m.id === highlight.threadId);
      if (index < 0) {
        // Load the right portion of messages
        jumpTo(highlight.threadId);
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

  useEffect(() => {
    if (messages.length)
      ChannelAPIClient.read(companyId, workspaceId || '', channelId || '', { status: true });
  }, [messages.length > 0]);

  const row = React.useMemo(
    () => (_: number, m: MessagesAndComponentsType) => {
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
    },
    [],
  );

  return (
    <MessagesListContext.Provider value={{ hideReplies: false, withBlock: true }}>
      {messages.length == 0 && <div style={{ flex: 1 }}></div>}
      {messages.length > 0 && (
        <ListBuilder
          refVirtuoso={listBuilderRef}
          onScroll={() => cancelHighlight()}
          initialItems={messages}
          itemId={m => m.type + m.threadId}
          emptyListComponent={<FirstMessage />}
          window={window}
          itemContent={row}
          loadMore={loadMoreMessages}
          atBottomStateChange={(atBottom: boolean) => {
            if (atBottom && window.reachedEnd)
              ChannelAPIClient.read(companyId, workspaceId || '', channelId || '', {
                status: true,
              });
          }}
        />
      )}
      {(!window.reachedEnd || true) && (
        <GoToBottom
          onClick={() => {
            /*RouterServices.push(
              RouterServices.generateRouteFromState({
                companyId: RouterServices.translator.toUUID('bDxmFx1KPWhhJeetsVj12J'),
                workspaceId: RouterServices.translator.toUUID('w31iupjuCFvvbf8ewYcYg7'), //Workspace id or the "direct" string
                channelId: RouterServices.translator.toUUID('d5eXg34uZ5gW2oK3umoRKQ'),
                threadId: RouterServices.translator.toUUID('e8ekvtUq1DtFHhKHjxzMCo'),
                messageId: RouterServices.translator.toUUID('uBNKdN9KUiM7u2TTfmoaJS'), //Optional, only if this must be redirected in the reply of a thread
              }),
            );*/
            jumpTo('');
          }}
        />
      )}
    </MessagesListContext.Provider>
  );
};
