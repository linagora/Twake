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
import { MessagesPlaceholder } from './placeholder';

type Props = {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
  threadId?: string;
};

export const MessagesListContext = React.createContext({ hideReplies: false, withBlock: false });

export default ({ channelId, companyId, workspaceId, threadId }: Props) => {
  const listBuilderRef = useRef<VirtuosoHandle>(null);
  const [atBottom, setAtBottom] = useState(true);

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

  const loadMoreMessages = async (
    direction: 'history' | 'future',
    limit?: number,
    offsetItem?: MessagesAndComponentsType,
  ) => {
    let messages = await loadMore(direction, limit, offsetItem?.threadId);
    return withNonMessagesComponents(
      convertToKeys(company.id, messages),
      window.reachedStart,
      shouldLimit,
    );
  };

  useEffect(() => {
    if (messages.length === 0) loadMore('history');
  }, []);

  const { highlight, cancelHighlight, reachedHighlight, updateHighlight } = useHighlightMessage();

  useEffect(() => {
    const { threadId, messageId } = RouterServices.getStateFromRoute();
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
        reachedHighlight();
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

  //This hide virtuoso but it start to work in backend
  const virtuosoLoading = highlight && !highlight?.reached;

  return (
    <MessagesListContext.Provider value={{ hideReplies: false, withBlock: true }}>
      {(!window.loaded || virtuosoLoading) && <MessagesPlaceholder />}
      {!window.loaded && <div style={{ flex: 1 }}></div>}
      {window.loaded && (
        <ListBuilder
          style={virtuosoLoading ? { opacity: 0 } : {}}
          refVirtuoso={listBuilderRef}
          onScroll={(e: any) => {
            const scrollBottom = e.target.scrollTop + e.target.clientHeight - e.target.scrollHeight;
            const closeToBottom = scrollBottom < 100 && window.reachedEnd;
            if (closeToBottom !== atBottom) setAtBottom(closeToBottom);
            cancelHighlight();
          }}
          initialItems={messages}
          itemId={m => m.type + m.threadId}
          emptyListComponent={<FirstMessage />}
          window={window}
          itemContent={row}
          loadMore={loadMoreMessages}
          atBottomStateChange={(atBottom: boolean) => {
            setAtBottom(atBottom && window.reachedEnd);
            if (atBottom && window.reachedEnd)
              ChannelAPIClient.read(companyId, workspaceId || '', channelId || '', {
                status: true,
              });
          }}
        />
      )}
      {!atBottom && (
        <GoToBottom
          onClick={() => {
            jumpTo('');
          }}
        />
      )}
    </MessagesListContext.Provider>
  );
};
