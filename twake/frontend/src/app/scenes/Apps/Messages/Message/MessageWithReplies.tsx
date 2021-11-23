import React, { useContext } from 'react';
import Message from './Message';
import Responses from './Responses';
import ReplyBlock from './Parts/ReplyBlock';
import LoadMoreReplies from './Parts/LoadMoreReplies';
import { MessagesListContext } from '../MessagesList';
import ThreadSection from '../Parts/ThreadSection';

export const MessageContext = React.createContext({ companyId: '', threadId: '', id: '' });

type Props = {
  companyId: string;
  threadId: string;
};

export default ({ threadId, companyId }: Props) => {
  const listContext = useContext(MessagesListContext);

  return (
    <MessageContext.Provider value={{ companyId, threadId, id: threadId }}>
      <div className="thread-container">
        <div className="thread-centerer">
          <div className="thread with-block">
            <ThreadSection>
              <Message />
            </ThreadSection>
            {!listContext.hideReplies && (
              <>
                <LoadMoreReplies />
                <Responses companyId={companyId} threadId={threadId} />
                <ReplyBlock />
              </>
            )}
          </div>
        </div>
      </div>
    </MessageContext.Provider>
  );
};
