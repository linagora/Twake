import React from 'react';
import { useThreadMessages } from 'app/state/recoil/hooks/useMessages';
import Message from './Message';
import TimeSeparator from './TimeSeparator';
import { MessageContext } from './MessageWithReplies';
import ThreadSection from '../Parts/ThreadSection';

type Props = {
  companyId: string;
  threadId: string;
};

export default ({ threadId, companyId }: Props) => {
  let { messages } = useThreadMessages({ companyId, threadId });
  //TODO use window to open more or less messages here

  console.log(messages);
  return (
    <>
      {messages.map(m => {
        return (
          <MessageContext.Provider key={m.id} value={{ ...m, id: m.id || '' }}>
            <ThreadSection canDrag alinea small>
              <Message />
            </ThreadSection>
          </MessageContext.Provider>
        );
      })}
    </>
  );
};
