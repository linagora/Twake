import React, { useEffect, useRef } from 'react';
import ListBuilder from './list-builder';
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
  const listBuilderRef = useRef<VirtuosoHandle>(null);
  const { highlight, cancelHighlight, reachedHighlight } = useHighlightMessage();
  let { messages, loadMore, window, jumpTo, convertToKeys } = useThreadMessages(
    {
      companyId,
      threadId: threadId || '',
    },
    {
      onMessages: messages => {
        console.log('vir new messages: ', messages);
      },
    },
  );
  messages = withNonMessagesComponents(messages, window.reachedStart);

  useEffect(() => {
    if (messages.length === 0) loadMore('history');
  }, []);

  const loadMoreMessages = async (
    direction: 'history' | 'future',
    limit?: number,
    offsetItem?: MessagesAndComponentsType,
  ) => {
    let messages = await loadMore(direction, limit, offsetItem?.id);
    return withNonMessagesComponents(convertToKeys(companyId, messages), window.reachedStart);
  };

  useEffect(() => {
    //Manage scroll to highlight
    if (
      listBuilderRef.current &&
      highlight &&
      !highlight.reached &&
      highlight.threadId === threadId
    ) {
      // Find the correct index of required message
      const index = messages.findIndex(m => m.id === highlight.id);
      if (index < 0) {
        // Load the right portion of messages
        jumpTo(highlight.id);
        return;
      }
      setTimeout(() => {
        if (listBuilderRef.current)
          listBuilderRef.current.scrollToIndex({
            align: 'start',
            index: index,
          });
        setTimeout(() => reachedHighlight(true), 1000);
      }, 1000);
    }
  }, [highlight, messages.length]);

  //This hide virtuoso but it start to work in backend
  const virtuosoLoading =
    highlight && highlight.threadId !== highlight.id && !highlight?.reachedAnswer;

  return (
    <MessagesListContext.Provider value={{ hideReplies: true, withBlock: false }}>
      {(!window.loaded || virtuosoLoading) && <MessagesPlaceholder />}
      {!window.loaded && <div style={{ flex: 1 }}></div>}
      {window.loaded && (
        <ListBuilder
          key={threadId}
          refVirtuoso={listBuilderRef}
          onScroll={() => cancelHighlight()}
          initialItems={messages}
          itemId={m => m.type + m.id}
          window={window}
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
      <GoToBottom
        onClick={() => {
          jumpTo('');
        }}
      />
    </MessagesListContext.Provider>
  );
};
