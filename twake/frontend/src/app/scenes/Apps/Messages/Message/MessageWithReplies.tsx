import React, { useContext, useState } from 'react';
import Message from './Message';
import Responses from './Responses';
import ReplyBlock from './Parts/ReplyBlock';
import LoadMoreReplies from './Parts/LoadMoreReplies';
import { MessagesListContext } from '../MessagesList';
import ThreadSection from '../Parts/ThreadSection';
import Thread from '../Parts/Thread';
import { useMessage } from 'app/state/recoil/hooks/useMessage';

export const MessageContext = React.createContext({ companyId: '', threadId: '', id: '' });

type Props = {
  companyId: string;
  threadId: string;
};

export default ({ threadId, companyId }: Props) => {
  const listContext = useContext(MessagesListContext);

  return (
    <MessageContext.Provider value={{ companyId, threadId, id: threadId }}>
      <Thread withBlock>
        <HeadMessage />
        {!listContext.hideReplies && (
          <>
            <LoadMoreReplies />
            <Responses companyId={companyId} threadId={threadId} />
            <ReplyBlock />
          </>
        )}
      </Thread>
    </MessageContext.Provider>
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
