import React, { Suspense, useContext, useState } from 'react';
import Message from './message';
import Responses from './responses';
import ReplyBlock from './parts/ReplyBlock';
import LoadMoreReplies from './parts/LoadMoreReplies';
import { MessagesListContext } from '../messages-list';
import ThreadSection from '../parts/thread-section';
import Thread from '../parts/thread';
import { useMessage } from 'app/state/recoil/hooks/messages/useMessage';
import ActivityMessage, { ActivityType } from './parts/ChannelActivity/ActivityMessage';

export const MessageContext = React.createContext({ companyId: '', threadId: '', id: '' });

type Props = {
  companyId: string;
  threadId: string;
  id?: string;
};

export default ({ threadId, companyId, id }: Props) => {
  return (
    <MessageContext.Provider value={{ companyId, threadId, id: id || threadId }}>
      <MessageType />
    </MessageContext.Provider>
  );
};

const MessageType = () => {
  const listContext = useContext(MessagesListContext);
  const context = useContext(MessageContext);
  const { message } = useMessage(context);

  if (message.subtype === 'system') {
    const activity = message?.context?.activity as ActivityType;
    return <ActivityMessage activity={activity} />;
  }

  return (
    <Thread withBlock={listContext.withBlock}>
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
