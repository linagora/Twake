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
import SideViewService from 'app/features/router/services/side-view-service';
import { Application } from 'app/features/applications/types/application';
import GoToBottom from './parts/go-to-bottom';
import { MessagesPlaceholder } from './placeholder';
import { cleanFrontMessagesFromListOfMessages } from 'app/features/messages/hooks/use-message-editor';
import { getMessage } from 'app/features/messages/hooks/use-message';
import messageApiClient from 'app/features/messages/api/message-api-client';
import User from 'app/features/users/services/current-user-service';
import { useChannelMembersReadSections } from 'app/features/channel-members/hooks/use-channel-members-read-sections';
import { delayRequest } from 'app/features/global/utils/managedSearchRequest';
import { useRefreshPublicOrPrivateChannels } from 'app/features/channels/hooks/use-public-or-private-channels';
import { usePageVisibility } from "react-page-visibility";

type Props = {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
  threadId?: string;
  readonly?: boolean;
};

export const MessagesListContext = React.createContext({
  hideReplies: false,
  withBlock: false,
  readonly: false,
});

export default ({ channelId, companyId, workspaceId, readonly }: Props) => {
  const listBuilderRef = useRef<ListBuilderHandle>(null);
  const [atBottom, setAtBottom] = useState(true);
  const { seen, refresh: loadReadSections } = useChannelMembersReadSections(
    companyId,
    workspaceId || 'direct',
    channelId || '',
  );

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

  const { refresh: refreshChannels } = useRefreshPublicOrPrivateChannels();
  const isPageVisible = usePageVisibility();

  useEffect(() => {
    if (messages.length === 0) loadMore('history');
  }, []);

  useEffect(() => {
    if (window.reachedEnd && atBottom && messages.length > 0 && isPageVisible) {
      const seenMessages = messages.filter(message => {
        const m = getMessage(message.id || message.threadId);
        const currentUserId = User.getCurrentUserId();

        if (m.user_id === currentUserId) {
          return false;
        }

        return m.status === 'delivered' || (m.status === 'read' && !seen(currentUserId, m.id));
      });
      if (seenMessages.length > 0) {
        delayRequest('message-list-read-request', async () => {
          await messageApiClient.read(
            companyId,
            channelId || '',
            workspaceId || 'direct',
            seenMessages,
          );
          await loadReadSections();
        });
      }
    }
  }, [messages, messages.length, window.reachedEnd, isPageVisible]);

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
    if (messages.length) {
      ChannelAPIClient.read(companyId, workspaceId || '', channelId || '', { status: true }).then(
        () => {
          refreshChannels();
        },
      );
    }
  }, [messages.length > 0]);

  useEffect(() => {
    if (messages.length) {
      delayRequest('message-list-load-read-sections', async () => {
        loadReadSections();
      });
    }
  }, [companyId, workspaceId, channelId, messages.length > 0]);

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
    <MessagesListContext.Provider
      value={{ hideReplies: false, withBlock: true, readonly: !!readonly }}
    >
      {(!window.loaded || virtuosoLoading) && <MessagesPlaceholder />}
      {!window.loaded && <div style={{ flex: 1 }}></div>}
      {window.loaded && (
        <ListBuilder
          ref={listBuilderRef}
          style={virtuosoLoading ? { opacity: 0 } : {}}
          onScroll={(e: React.UIEvent<'div', UIEvent>) => {
            const scrollBottom =
              (e.target as HTMLElement).scrollHeight -
              (e.target as HTMLElement).scrollTop -
              (e.target as HTMLElement).clientHeight;
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
          atBottomStateChange={async (atBottom: boolean) => {
            if (atBottom && window.reachedEnd) {
              setAtBottom(true);
              await ChannelAPIClient.read(companyId, workspaceId || '', channelId || '', {
                status: true,
              });
              refreshChannels();
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
