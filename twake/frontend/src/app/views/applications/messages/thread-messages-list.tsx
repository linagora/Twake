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
} from '../../../features/messages/hooks/with-non-messages-components';
import { useHighlightMessage } from 'app/features/messages/hooks/use-highlight-message';
import GoToBottom from './parts/go-to-bottom';
import { MessagesPlaceholder } from './placeholder';
import { cleanFrontMessagesFromListOfMessages } from 'app/features/messages/hooks/use-message-editor';
import { getMessage } from 'app/features/messages/hooks/use-message';

type Props = {
  companyId: string;
  workspaceId: string;
  channelId: string;
  threadId: string;
  readonly?: boolean;
};

export default ({ companyId, workspaceId, channelId, threadId, readonly }: Props) => {
  const listBuilderRef = useRef<ListBuilderHandle>(null);
  const [atBottom, setAtBottom] = useState(true);

  const { highlight, cancelHighlight, reachedHighlight } = useHighlightMessage();
  const {
    messages: _messages,
    loadMore,
    window,
    jumpTo,
    convertToKeys,
  } = useThreadMessages({
    companyId,
    threadId: threadId || '',
  });
  const messages = withNonMessagesComponents(_messages, window.reachedStart);

  useEffect(() => {
    loadMore('history');
  }, []);

  const loadMoreMessages = async (
    direction: 'history' | 'future',
    limit?: number,
    offsetItem?: MessagesAndComponentsType,
  ) => {
    const messages = await loadMore(direction, limit, offsetItem?.id);
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
    <MessagesListContext.Provider
      value={{ hideReplies: true, withBlock: false, readonly: !!readonly }}
    >
      {(!window.loaded || virtuosoLoading) && <MessagesPlaceholder />}
      {!window.loaded && <div style={{ flex: 1 }}></div>}
      {window.loaded && (
        <ListBuilder
          key={threadId}
          followOutput={!!window.reachedEnd && 'smooth'}
          ref={listBuilderRef}
          style={virtuosoLoading ? { opacity: 0 } : {}}
          onScroll={(e: React.UIEvent<'div', UIEvent>) => {
            const scrollBottom =
              (e.target as HTMLElement).scrollHeight -
              (e.target as HTMLElement).scrollTop -
              (e.target as HTMLElement).clientHeight;
            const closeToBottom = scrollBottom < 100;
            if (closeToBottom !== atBottom) setAtBottom(closeToBottom);
            cancelHighlight();
          }}
          items={messages}
          itemId={m => m.type + (getMessage(m.id)?.context?._front_id || m.id) + m.id}
          emptyListComponent={<FirstThreadMessage noReplies />}
          filterOnAppend={messages => {
            return cleanFrontMessagesFromListOfMessages(messages);
          }}
          itemContent={(_index, m) => {
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
                <MessageWithReplies
                  companyId={m.companyId}
                  workspaceId={workspaceId || ''}
                  channelId={channelId || ''}
                  threadId={m.threadId}
                  id={m.id}
                />
              </div>
            );
          }}
          loadMore={loadMoreMessages}
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
