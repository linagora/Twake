import React, { useEffect, useRef, useState } from 'react';
import ListBuilder, { ListBuilderHandle } from './list-builder';
import TimeSeparator from './message/time-separator';
import MessageWithReplies from './message/message-with-replies';
import FirstThreadMessage from './message/parts/FirstMessage/FirstThreadMessage';
import { MessagesListContext } from './messages-list';
import { useThreadMessages } from 'app/features/messages/hooks/use-thread-messages';
import {
  MessagesAndComponentsType,
  withNonMessagesComponents,
} from './with-non-messages-components';
import { useHighlightMessage } from 'app/features/messages/hooks/use-highlight-message';
import { VirtuosoHandle } from 'react-virtuoso';
import GoToBottom from './parts/go-to-bottom';
import { MessagesPlaceholder } from './placeholder';

type Props = {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
  threadId: string;
};

export default ({ companyId, threadId }: Props) => {
  const listBuilderRef = useRef<ListBuilderHandle>(null);
  const [atBottom, setAtBottom] = useState(true);

  const { highlight, cancelHighlight, reachedHighlight } = useHighlightMessage();
  let { messages, loadMore, window, jumpTo, convertToKeys } = useThreadMessages({
    companyId,
    threadId: threadId || '',
  });
  messages = withNonMessagesComponents(messages, window.reachedStart);

  useEffect(() => {
    if (messages.length === 0) loadMore('history');
  }, []);

  const loadMoreMessages = async (
    direction: 'history' | 'future',
    limit?: number,
    offsetItem?: MessagesAndComponentsType,
  ) => {
    console.log('loadMoremessages offset', offsetItem);
    let messages = await loadMore(direction, limit, offsetItem?.id);
    return withNonMessagesComponents(
      convertToKeys(companyId, messages),
      window.reachedStart && direction === 'history',
    );
  };

  useEffect(() => {
    //Manage scroll to highlight
    if (
      listBuilderRef.current &&
      highlight &&
      highlight.answerId &&
      highlight.reachedThread &&
      !highlight.reachedAnswer
    ) {
      // Find the correct index of required message
      const index = messages.findIndex(m => m.id === highlight.answerId);
      if (index < 0) {
        // Load the right portion of messages
        jumpTo(highlight.answerId);
        return;
      }
      setTimeout(() => {
        if (listBuilderRef.current)
          listBuilderRef.current.scrollToIndex({
            align: 'start',
            index: index,
          });
        setTimeout(() => reachedHighlight('answer'), 1000);
      }, 1000);
    }
  }, [highlight, messages.length]);

  const jumpToBottom = () => {
    if (window.reachedEnd) {
      listBuilderRef.current?.scrollTo({ top: 10000000, behavior: 'smooth' });
    } else {
      // Load the right portion of messages
      jumpTo('');
    }
  };

  //This hide virtuoso but it start to work in backend
  const virtuosoLoading = highlight && highlight.answerId && !highlight?.reachedAnswer;

  return (
    <MessagesListContext.Provider value={{ hideReplies: true, withBlock: false }}>
      {(!window.loaded || virtuosoLoading) && <MessagesPlaceholder />}
      {!window.loaded && <div style={{ flex: 1 }}></div>}
      {window.loaded && (
        <ListBuilder
          key={threadId}
          followOutput={!!window.reachedEnd && 'smooth'}
          ref={listBuilderRef}
          style={virtuosoLoading ? { opacity: 0 } : {}}
          onScroll={(e: any) => {
            const scrollBottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight;
            const closeToBottom = scrollBottom < 100;
            if (closeToBottom !== atBottom) setAtBottom(closeToBottom);
            cancelHighlight();
          }}
          items={messages}
          itemId={m => m.type + m.id}
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
          loadMore={loadMoreMessages}
        />
      )}
      {!(atBottom && window.reachedEnd) && window.loaded && (
        <GoToBottom
          onClick={() => {
            jumpToBottom();
          }}
        />
      )}
    </MessagesListContext.Provider>
  );
};
