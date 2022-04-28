import React, { Suspense, useContext, useState } from 'react';
import Message from './message';
import Responses from './responses';
import ReplyBlock from './parts/ReplyBlock';
import LoadMoreReplies from './parts/LoadMoreReplies';
import { MessagesListContext } from '../messages-list';
import ThreadSection from '../parts/thread-section';
import Thread from '../parts/thread';
import { useMessage } from 'app/features/messages/hooks/use-message';
import ActivityMessage, { ActivityType } from './parts/ChannelActivity/ActivityMessage';
import { useHighlightMessage } from 'app/features/messages/hooks/use-highlight-message';

export const MessageContext = React.createContext({ companyId: '', threadId: '', id: '' });

type Props = {
  companyId: string;
  threadId: string;
  id?: string;
};

export default React.memo(({ threadId, companyId, id }: Props) => {
  return (
    <MessageContext.Provider value={{ companyId, threadId, id: id || threadId }}>
      <MessageType />
    </MessageContext.Provider>
  );
});

const MessageType = () => {
  const listContext = useContext(MessagesListContext);
  const context = useContext(MessageContext);
  const { message } = useMessage(context);
  const { highlight } = useHighlightMessage();
  const highlighted =
    (highlight && (highlight.threadId === context.id || highlight.id === context.id)) || false;

  if (message.subtype === 'system') {
    const activity = message?.context?.activity as ActivityType;
    return <ActivityMessage activity={activity} />;
  }

  return (
    <Thread withBlock={listContext.withBlock} highlighted={highlighted}>
      <HeadMessage />
      {!listContext.hideReplies && (
        <>
          <LoadMoreReplies />
          <Responses companyId={context.companyId} threadId={context.threadId} />
          <ReplyBlock />
        </>
      )}
    </Thread>
  );
};

const HeadMessage = () => {
  const context = useContext(MessageContext);
  const { message } = useMessage(context);
  return (
    <ThreadSection withAvatar head pinned={!!message.pinned_info?.pinned_at}>
      <Message />
    </ThreadSection>
  );
};
