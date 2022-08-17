import React, { useEffect, useRef, useState } from 'react';
import { useChannelMessages } from 'app/features/messages/hooks/use-channel-messages';
import ListBuilder, { ListBuilderHandle } from './list-builder';
import TimeSeparator from './message/time-separator';
import MessageWithReplies from './message/message-with-replies';
import FirstMessage from './message/parts/FirstMessage/FirstMessage';
import LockedHistoryBanner from 'app/components/locked-features-components/locked-history-banner/locked-history-banner';
import MessageHistoryService from 'app/features/messages/services/message-history-service';
import { useCurrentCompany } from 'app/features/companies/hooks/use-companies';
import ChannelAPIClient from 'app/features/channels/api/channel-api-client';
import {
  MessagesAndComponentsType,
  withNonMessagesComponents,
} from '../../../features/messages/hooks/with-non-messages-components';
import { useHighlightMessage } from 'app/features/messages/hooks/use-highlight-message';
import { VirtuosoHandle } from 'react-virtuoso';
import SideViewService from 'app/features/router/services/side-view-service';
import { Application } from 'app/features/applications/types/application';
import RouterServices from 'app/features/router/services/router-service';
import GoToBottom from './parts/go-to-bottom';
import { MessagesPlaceholder } from './placeholder';
import { cleanFrontMessagesFromListOfMessages } from 'app/features/messages/hooks/use-message-editor';
import { getMessage } from 'app/features/messages/hooks/use-message';
import messageApiClient from 'app/features/messages/api/message-api-client';
import User from 'app/features/users/services/current-user-service';

type Props = {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
  threadId?: string;
};

export const MessagesListContext = React.createContext({ hideReplies: false, withBlock: false });

export default ({ channelId, companyId, workspaceId, threadId }: Props) => {
  const listBuilderRef = useRef<ListBuilderHandle>(null);
  const [atBottom, setAtBottom] = useState(true);

  const {
    messages: _messages,
    loadMore,
    window,
    jumpTo,
    convertToKeys,
  } = useChannelMessages({
    companyId,
    workspaceId: workspaceId || '',
    channelId: channelId || '',
  });
  let messages = _messages;
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
    const messages = await loadMore(direction, limit, offsetItem?.threadId);
    return withNonMessagesComponents(
      convertToKeys(company.id, messages),
      window.reachedStart && direction === 'history',
      shouldLimit && direction === 'history',
    );
  };

  useEffect(() => {
    if (messages.length === 0) loadMore('history');
  }, []);

  useEffect(() => {
    if (window.reachedEnd && atBottom) {
      const seenMessages = messages.filter(message => {
        const m = getMessage(message.id || message.threadId);

        return m.user_id !== User.getCurrentUserId() && m.status === 'delivered';
      });
      messageApiClient.read(companyId, seenMessages);
    }
  }, [messages, window.reachedEnd]);

  const { highlight, cancelHighlight, reachedHighlight } = useHighlightMessage();

  useEffect(() => {
    //Manage scroll to highlight
    if (listBuilderRef.current && highlight && !highlight.reachedThread) {
      if (highlight.answerId) {
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
        setTimeout(() => {
          //Need to wait a bit for the scroll to ends
          reachedHighlight('thread');
        }, 1000);
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
          <MessageWithReplies
            companyId={m.companyId}
            workspaceId={workspaceId || ''}
            channelId={channelId || ''}
            threadId={m.threadId}
          />
        </div>
      );
    },
    [],
  );

  const jumpToBottom = () => {
    if (window.reachedEnd) {
      listBuilderRef.current?.scrollTo({ top: 10000000, behavior: 'smooth' });
    } else {
      // Load the right portion of messages
      jumpTo('');
    }
  };

  //This hide virtuoso but it start to work in backend
  const virtuosoLoading = highlight && !highlight?.reachedThread;

  return (
    <MessagesListContext.Provider value={{ hideReplies: false, withBlock: true }}>
      {(!window.loaded || virtuosoLoading) && <MessagesPlaceholder />}
      {!window.loaded && <div style={{ flex: 1 }}></div>}
      {window.loaded && (
        <ListBuilder
          ref={listBuilderRef}
          style={virtuosoLoading ? { opacity: 0 } : {}}
          onScroll={(e: any) => {
            const scrollBottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight;
            const closeToBottom = scrollBottom < 500;
            if (closeToBottom !== atBottom) setAtBottom(closeToBottom);
            cancelHighlight();
          }}
          items={messages}
          filterOnAppend={messages => {
            return cleanFrontMessagesFromListOfMessages(messages);
          }}
          itemId={m => m.type + (getMessage(m.id)?.context?._front_id || m.threadId) + m.id}
          emptyListComponent={<FirstMessage />}
          itemContent={row}
          followOutput={!!window.reachedEnd && 'smooth'}
          loadMore={loadMoreMessages}
          atBottomStateChange={(atBottom: boolean) => {
            if (atBottom && window.reachedEnd) {
              setAtBottom(true);
              ChannelAPIClient.read(companyId, workspaceId || '', channelId || '', {
                status: true,
              });
            }
          }}
        />
      )}
      {!(atBottom && window.reachedEnd) && window.loaded && messages.length > 0 && (
        <GoToBottom
          onClick={() => {
            jumpToBottom();
          }}
        />
      )}
    </MessagesListContext.Provider>
  );
};
